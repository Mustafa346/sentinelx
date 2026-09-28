import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import DetectionRule from "@/models/DetectionRule";
import Alert from "@/models/Alert";

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const rules = await DetectionRule.find({});

  const mappings = [];
  for (const rule of rules) {
    const [alertCount, bySeverity] = await Promise.all([
      Alert.countDocuments({ detectionRule: rule._id }),
      Alert.aggregate([
        { $match: { detectionRule: rule._id } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
    ]);

    mappings.push({
      techniqueId: rule.mitreTechniqueId,
      techniqueName: rule.mitreTechniqueName,
      tactic: rule.mitreTactic,
      detectionType: rule.detectionType,
      ruleName: rule.name,
      severity: rule.severity,
      alertCount,
      bySeverity: bySeverity.map((s) => ({ severity: s._id, count: s.count })),
    });
  }

  return apiSuccess({ mappings });
}
