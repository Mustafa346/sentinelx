import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import User, { ROLES, DEPARTMENTS } from "@/models/User";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { writeAuditLog } from "@/services/auditLog";

export async function GET(request, { params }) {
  const { user: actor, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;

  if (actor.role !== "ADMIN" && actor._id.toString() !== id) {
    return apiError("Insufficient permissions", "FORBIDDEN", 403);
  }

  const target = await User.findById(id);
  if (!target) return apiError("User not found", "NOT_FOUND", 404);

  return apiSuccess({ user: target });
}

export async function PATCH(request, { params }) {
  const { user: actor, errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;
  const target = await User.findById(id);
  if (!target) return apiError("User not found", "NOT_FOUND", 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  const changes = [];

  if (body.role) {
    if (!ROLES.includes(body.role)) return apiError("Invalid role", "VALIDATION_ERROR", 400);
    if (body.role !== target.role) {
      changes.push(`role ${target.role} -> ${body.role}`);
      target.role = body.role;
    }
  }
  if (body.department) {
    if (!DEPARTMENTS.includes(body.department)) return apiError("Invalid department", "VALIDATION_ERROR", 400);
    target.department = body.department;
  }
  if (body.name) target.name = body.name;

  if (body.status) {
    if (!["ACTIVE", "DISABLED", "LOCKED"].includes(body.status)) {
      return apiError("Invalid status", "VALIDATION_ERROR", 400);
    }
    if (body.status !== target.status) {
      changes.push(`status ${target.status} -> ${body.status}`);
      target.status = body.status;
      if (body.status === "ACTIVE") {
        target.failedLoginCount = 0;
        target.lockedUntil = null;
      }
    }
  }

  if (body.newPassword) {
    const problems = validatePasswordStrength(body.newPassword);
    if (problems.length) return apiError(problems.join(" "), "WEAK_PASSWORD", 400);
    target.passwordHash = await hashPassword(body.newPassword);
    target.failedLoginCount = 0;
    target.lockedUntil = null;
    changes.push("password reset by admin");
  }

  await target.save();

  await writeAuditLog({
    actor: actor._id,
    actorUsername: actor.username,
    action: "USER_UPDATED",
    target: target.username,
    targetType: "User",
    description: changes.length ? changes.join(", ") : "No-op update",
  });

  return apiSuccess({ user: target });
}

export async function DELETE(request, { params }) {
  const { user: actor, errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;

  if (actor._id.toString() === id) {
    return apiError("You cannot delete your own account", "FORBIDDEN", 400);
  }

  const target = await User.findById(id);
  if (!target) return apiError("User not found", "NOT_FOUND", 404);

  await User.deleteOne({ _id: id });

  await writeAuditLog({
    actor: actor._id,
    actorUsername: actor.username,
    action: "USER_DELETED",
    target: target.username,
    targetType: "User",
    description: `Deleted user ${target.username}`,
  });

  return apiSuccess({ message: "User deleted" });
}
