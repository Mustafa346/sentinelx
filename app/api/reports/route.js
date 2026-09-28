import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import Alert from "@/models/Alert";
import IncidentReport from "@/models/IncidentReport";
import Playbook from "@/models/Playbook";
import { generateId } from "@/lib/utils";
import { writeAuditLog } from "@/services/auditLog";

export async function POST(request) {
  const { user, errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "BAD_REQUEST", 400);
  }

  if (!body.alertId) return apiError("alertId is required", "VALIDATION_ERROR", 400);

  await connectDB();

  const alert = await Alert.findOne({ alertId: body.alertId })
    .populate("evidence")
    .populate("assignedAnalyst", "name username")
    .populate("investigationNotes.author", "name username")
    .populate("detectionRule");

  if (!alert) return apiError("Alert not found", "NOT_FOUND", 404);

  const playbook = await Playbook.findOne({ detectionType: alert.detectionType });

  const snapshot = {
    alert: alert.toObject(),
    playbookSteps: playbook?.steps || [],
    generatedAt: new Date(),
    generatedBy: { name: user.name, username: user.username, role: user.role },
  };

  const report = await IncidentReport.create({
    reportId: generateId("RPT"),
    alert: alert._id,
    generatedBy: user._id,
    title: `Incident Report - ${alert.title} (${alert.alertId})`,
    snapshot,
  });

  await writeAuditLog({
    actor: user._id,
    actorUsername: user.username,
    action: "REPORT_GENERATED",
    target: report.reportId,
    targetType: "IncidentReport",
    description: `Generated incident report for ${alert.alertId}`,
  });

  return apiSuccess({ report }, 201);
}

export async function GET(request) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const reports = await IncidentReport.find({})
    .populate("generatedBy", "name username")
    .sort({ createdAt: -1 })
    .limit(50);

  return apiSuccess({ reports });
}
