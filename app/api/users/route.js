import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import User, { ROLES, DEPARTMENTS } from "@/models/User";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { writeAuditLog } from "@/services/auditLog";

export async function GET(request) {
  const { errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const query = {};
  if (searchParams.get("role")) query.role = searchParams.get("role");
  if (searchParams.get("department")) query.department = searchParams.get("department");
  if (searchParams.get("status")) query.status = searchParams.get("status");

  const users = await User.find(query).sort({ createdAt: -1 });
  return apiSuccess({ users });
}

export async function POST(request) {
  const { user: actor, errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  const { name, email, username, password, role, department } = body || {};
  if (!name || !email || !username || !password || !role) {
    return apiError("name, email, username, password and role are required", "VALIDATION_ERROR", 400);
  }
  if (!ROLES.includes(role)) return apiError("Invalid role", "VALIDATION_ERROR", 400);

  const passwordProblems = validatePasswordStrength(password);
  if (passwordProblems.length) return apiError(passwordProblems.join(" "), "WEAK_PASSWORD", 400);

  await connectDB();

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedUsername = String(username).toLowerCase().trim();

  const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] });
  if (existing) return apiError("A user with that email or username already exists", "USER_EXISTS", 409);

  const passwordHash = await hashPassword(password);
  const newUser = await User.create({
    name,
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash,
    role,
    department: DEPARTMENTS.includes(department) ? department : "IT",
    status: "ACTIVE",
  });

  await writeAuditLog({
    actor: actor._id,
    actorUsername: actor.username,
    action: "USER_CREATED",
    target: newUser.username,
    targetType: "User",
    description: `Created ${role} account for ${newUser.username}`,
  });

  return apiSuccess({ user: newUser }, 201);
}
