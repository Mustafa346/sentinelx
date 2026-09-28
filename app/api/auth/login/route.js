import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword } from "@/lib/password";
import { signSession, setSessionCookie } from "@/lib/session";
import { apiError, apiSuccess } from "@/lib/authGuard";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { parseUserAgent, getRequestIP } from "@/lib/utils";
import { recordIdentityEvent } from "@/services/eventPipeline";
import { writeAuditLog } from "@/services/auditLog";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request) {
  const ip = getClientIP(request);

  // Rate limit: 10 login attempts per minute per IP, independent of the
  // per-account lockout below - this protects against distributed spray
  // attempts hammering the endpoint itself.
  const limit = rateLimit(`login:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return apiError("Too many login attempts. Please try again shortly.", "RATE_LIMITED", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  const { username, password } = body || {};
  if (!username || !password) {
    return apiError("Username and password are required", "VALIDATION_ERROR", 400);
  }

  await connectDB();

  const ua = parseUserAgent(request.headers.get("user-agent") || "");
  const sourceIP = getRequestIP(request);
  const lookupValue = String(username).toLowerCase().trim();

  const user = await User.findOne({
    $or: [{ username: lookupValue }, { email: lookupValue }],
  });

  // Generic failure event fields shared by every failure branch below.
  const baseEventFields = {
    username: user ? user.username : lookupValue,
    userId: user ? user._id : null,
    eventType: "LOGIN_FAILURE",
    result: "FAILED",
    sourceIP,
    device: ua.device,
    browser: ua.browser,
    operatingSystem: ua.os,
    userAgent: request.headers.get("user-agent") || "",
  };

  if (!user) {
    await recordIdentityEvent({ ...baseEventFields, failureReason: "UNKNOWN_USER" });
    return apiError("Invalid username or password", "INVALID_CREDENTIALS", 401);
  }

  if (user.status === "DISABLED") {
    await recordIdentityEvent({ ...baseEventFields, failureReason: "ACCOUNT_DISABLED" });
    return apiError("This account has been disabled", "ACCOUNT_DISABLED", 403);
  }

  if (user.status === "LOCKED" && user.lockedUntil && user.lockedUntil > new Date()) {
    await recordIdentityEvent({ ...baseEventFields, failureReason: "ACCOUNT_LOCKED" });
    return apiError(
      `Account is locked until ${user.lockedUntil.toLocaleTimeString()}`,
      "ACCOUNT_LOCKED",
      403
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    user.failedLoginCount += 1;

    let lockedThisAttempt = false;
    if (user.failedLoginCount >= LOCKOUT_THRESHOLD) {
      user.status = "LOCKED";
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
      lockedThisAttempt = true;
    }
    await user.save();

    await recordIdentityEvent({ ...baseEventFields, failureReason: "INVALID_PASSWORD" });

    if (lockedThisAttempt) {
      await recordIdentityEvent({
        username: user.username,
        userId: user._id,
        eventType: "ACCOUNT_LOCKED",
        result: "INFO",
        sourceIP,
        device: ua.device,
        browser: ua.browser,
        operatingSystem: ua.os,
      });
      return apiError(
        "Too many failed attempts. Account has been locked for 15 minutes.",
        "ACCOUNT_LOCKED",
        403
      );
    }

    return apiError("Invalid username or password", "INVALID_CREDENTIALS", 401);
  }

  // Successful login
  user.failedLoginCount = 0;
  user.status = "ACTIVE";
  user.lockedUntil = null;
  await user.save();

  const successFields = {
    username: user.username,
    userId: user._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP,
    country: "Pakistan",
    city: "Peshawar",
    device: ua.device,
    browser: ua.browser,
    operatingSystem: ua.os,
    userAgent: request.headers.get("user-agent") || "",
  };

  await recordIdentityEvent(successFields);

  if (user.role === "ADMIN") {
    await recordIdentityEvent({ ...successFields, eventType: "ADMIN_LOGIN", result: "INFO" });
  }

  const token = signSession({ sub: user._id.toString(), role: user.role, username: user.username });
  await setSessionCookie(token);

  await writeAuditLog({
    actor: user._id,
    actorUsername: user.username,
    action: "LOGIN",
    target: user.username,
    targetType: "User",
    description: "Successful login",
    ip: sourceIP,
  });

  return apiSuccess({
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
}
