import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import Alert from "@/models/Alert";

export async function GET(request) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 20));

  const query = {};
  if (searchParams.get("severity")) query.severity = searchParams.get("severity");
  if (searchParams.get("status")) query.status = searchParams.get("status");
  if (searchParams.get("detectionType")) query.detectionType = searchParams.get("detectionType");
  if (searchParams.get("username")) query.username = searchParams.get("username");
  if (searchParams.get("sourceIP")) query.sourceIP = searchParams.get("sourceIP");
  if (searchParams.get("assignedAnalyst")) query.assignedAnalyst = searchParams.get("assignedAnalyst");

  const [alerts, total] = await Promise.all([
    Alert.find(query)
      .populate("assignedAnalyst", "name username")
      .populate("detectionRule", "name ruleId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Alert.countDocuments(query),
  ]);

  return apiSuccess({ alerts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
