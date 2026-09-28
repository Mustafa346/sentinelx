import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import DetectionRule from "@/models/DetectionRule";
import { writeAuditLog } from "@/services/auditLog";

export async function PATCH(request, { params }) {
  const { user, errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;
  const rule = await DetectionRule.findOne({ ruleId: id });
  if (!rule) return apiError("Detection rule not found", "NOT_FOUND", 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  const changeLog = [];

  if (body.status && ["ENABLED", "DISABLED"].includes(body.status)) {
    rule.status = body.status;
    changeLog.push(`status -> ${body.status}`);
  }
  if (typeof body.threshold === "number") {
    rule.threshold = body.threshold;
    changeLog.push(`threshold -> ${body.threshold}`);
  }
  if (typeof body.distinctUserThreshold === "number") {
    rule.distinctUserThreshold = body.distinctUserThreshold;
    changeLog.push(`distinctUserThreshold -> ${body.distinctUserThreshold}`);
  }
  if (typeof body.timeWindowMinutes === "number") {
    rule.timeWindowMinutes = body.timeWindowMinutes;
    changeLog.push(`timeWindowMinutes -> ${body.timeWindowMinutes}`);
  }

  if (body.addExclusion) {
    const { sourceIP, username, startHour, endHour, reason } = body.addExclusion;
    rule.exclusions.push({
      sourceIP: sourceIP || null,
      username: username || null,
      startHour: startHour ?? null,
      endHour: endHour ?? null,
      reason: reason || "",
      createdBy: user._id,
      createdAt: new Date(),
    });
    changeLog.push(`exclusion added: ${reason || "unspecified reason"}`);
  }

  if (body.removeExclusionIndex !== undefined) {
    rule.exclusions.splice(body.removeExclusionIndex, 1);
    changeLog.push("exclusion removed");
  }

  if (changeLog.length === 0) {
    return apiError("No valid fields to update", "VALIDATION_ERROR", 400);
  }

  rule.history.push({ changedBy: user._id, change: changeLog.join(", "), changedAt: new Date() });
  await rule.save();

  await writeAuditLog({
    actor: user._id,
    actorUsername: user.username,
    action: "DETECTION_RULE_UPDATED",
    target: rule.ruleId,
    targetType: "DetectionRule",
    description: changeLog.join(", "),
  });

  return apiSuccess({ rule });
}
