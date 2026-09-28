import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import DetectionRule from "@/models/DetectionRule";

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const rules = await DetectionRule.find({ "exclusions.0": { $exists: true } })
    .select("ruleId name detectionType exclusions")
    .populate("exclusions.createdBy", "name username");

  const exceptions = rules.flatMap((rule) =>
    rule.exclusions.map((ex, index) => ({
      ruleId: rule.ruleId,
      ruleName: rule.name,
      detectionType: rule.detectionType,
      index,
      ...ex.toObject(),
    }))
  );

  return apiSuccess({ exceptions });
}
