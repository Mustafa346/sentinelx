import { connectDB } from "@/lib/db";
import User, { DEPARTMENTS } from "@/models/User";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { apiError, apiSuccess } from "@/lib/authGuard";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { writeAuditLog } from "@/services/auditLog";

export async function POST(request) {
  const ip = getClientIP(request);
  const limit = rateLimit(`register:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return apiError("Too many registration attempts. Please try again shortly.", "RATE_LIMITED", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  const { name, email, username, password, department } = body || {};

  if (!name || !email || !username || !password) {
    return apiError("Name, email, username and password are required", "VALIDATION_ERROR", 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return apiError("Invalid email address", "VALIDATION_ERROR", 400);
  }

  const passwordProblems = validatePasswordStrength(password);
  if (passwordProblems.length) {
    return apiError(passwordProblems.join(" "), "WEAK_PASSWORD", 400);
  }

  await connectDB();

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedUsername = String(username).toLowerCase().trim();

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });
  if (existing) {
    return apiError("An account with that email or username already exists", "USER_EXISTS", 409);
  }

  const passwordHash = await hashPassword(password);

  // Public self-registration always creates an EMPLOYEE account. Role
  // elevation must go through an admin - never trust a role field from
  // an unauthenticated request body.
  const user = await User.create({
    name,
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash,
    role: "EMPLOYEE",
    department: DEPARTMENTS.includes(department) ? department : "IT",
    status: "ACTIVE",
  });

  await writeAuditLog({
    actor: user._id,
    actorUsername: user.username,
    action: "USER_REGISTERED",
    target: user.username,
    targetType: "User",
    description: "Self-registration",
    ip: getClientIP(request),
  });

  return apiSuccess(
    { message: "Account created. You can now log in." },
    201
  );
}
