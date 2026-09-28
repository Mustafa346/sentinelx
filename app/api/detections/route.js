import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import DetectionRule from "@/models/DetectionRule";

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const rules = await DetectionRule.find({}).sort({ name: 1 });
  return apiSuccess({ rules });
}
