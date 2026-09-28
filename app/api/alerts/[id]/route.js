import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import Alert from "@/models/Alert";
import DetectionRule from "@/models/DetectionRule";
import { writeAuditLog, createNotification } from "@/services/auditLog";

const VALID_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "INVESTIGATING",
  "TRUE_POSITIVE",
  "FALSE_POSITIVE",
  "RESOLVED",
  "CLOSED",
];

const FALSE_POSITIVE_REASONS = [
  "Known admin activity",
  "Scheduled maintenance",
  "Helpdesk activity",
  "Trusted IP",
  "Authorized device",
  "Expected behavior",
];

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;

  const alert = await Alert.findOne({ alertId: id })
    .populate("evidence")
    .populate("assignedAnalyst", "name username")
    .populate("investigationNotes.author", "name username")
    .populate("detectionRule")
    .populate("user", "name username email department");

  if (!alert) return apiError("Alert not found", "NOT_FOUND", 404);

  return apiSuccess({ alert });
}

export async function PATCH(request, { params }) {
  const { user, errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;

  const alert = await Alert.findOne({ alertId: id });
  if (!alert) return apiError("Alert not found", "NOT_FOUND", 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  const changes = [];

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return apiError("Invalid status", "VALIDATION_ERROR", 400);
    }
    if (body.status === "FALSE_POSITIVE" && !body.falsePositiveReason) {
      return apiError("A false-positive reason is required", "VALIDATION_ERROR", 400);
    }
    if (body.falsePositiveReason && !FALSE_POSITIVE_REASONS.includes(body.falsePositiveReason)) {
      return apiError("Invalid false-positive reason", "VALIDATION_ERROR", 400);
    }
    alert.status = body.status;
    if (body.status === "FALSE_POSITIVE") alert.falsePositiveReason = body.falsePositiveReason;
    changes.push(`status -> ${body.status}`);
  }

  if (body.assignToSelf) {
    alert.assignedAnalyst = user._id;
    if (alert.status === "NEW") alert.status = "IN_REVIEW";
    changes.push(`assigned to ${user.username}`);
  } else if (body.assignedAnalyst !== undefined) {
    alert.assignedAnalyst = body.assignedAnalyst || null;
    changes.push("reassigned");
  }

  if (body.note) {
    alert.investigationNotes.push({ author: user._id, note: body.note, createdAt: new Date() });
    changes.push("note added");
  }

  await alert.save();

  await writeAuditLog({
    actor: user._id,
    actorUsername: user.username,
    action: "ALERT_UPDATED",
    target: alert.alertId,
    targetType: "Alert",
    description: changes.join(", "),
  });

  if (body.status === "FALSE_POSITIVE") {
    await createNotification({
      audienceRoles: ["ADMIN", "SECURITY_ANALYST"],
      title: "Alert marked false positive",
      message: `${alert.title} (${alert.alertId}) was marked as a false positive: ${body.falsePositiveReason}.`,
      severity: "INFO",
      relatedAlert: alert._id,
    });
  }

  return apiSuccess({ alert });
}
