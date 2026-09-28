import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import IncidentReport from "@/models/IncidentReport";

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { id } = await params;

  const report = await IncidentReport.findOne({ reportId: id }).populate("generatedBy", "name username");
  if (!report) return apiError("Report not found", "NOT_FOUND", 404);

  return apiSuccess({ report });
}
