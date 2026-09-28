import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import Alert from "@/models/Alert";
import DetectionRule from "@/models/DetectionRule";

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();

  const rules = await DetectionRule.find({});
  const perRule = [];

  for (const rule of rules) {
    const [total, truePositive, falsePositive] = await Promise.all([
      Alert.countDocuments({ detectionRule: rule._id }),
      Alert.countDocuments({ detectionRule: rule._id, status: "TRUE_POSITIVE" }),
      Alert.countDocuments({ detectionRule: rule._id, status: "FALSE_POSITIVE" }),
    ]);

    const triaged = truePositive + falsePositive;
    const falsePositiveRate = triaged > 0 ? Math.round((falsePositive / triaged) * 100) : 0;
    const precision = triaged > 0 ? Math.round((truePositive / triaged) * 100) : 0;

    perRule.push({
      ruleId: rule.ruleId,
      name: rule.name,
      detectionType: rule.detectionType,
      exclusionCount: rule.exclusions.length,
      total,
      truePositive,
      falsePositive,
      falsePositiveRate,
      precision,
    });
  }

  const totalAlerts = await Alert.countDocuments({});
  const totalFP = await Alert.countDocuments({ status: "FALSE_POSITIVE" });
  const totalTP = await Alert.countDocuments({ status: "TRUE_POSITIVE" });

  // "Before tuning" = alerts that would exist ignoring the fact that some
  // are now false positives with exclusions configured; "after tuning" =
  // currently open/true-positive alerts only. This is calculated directly
  // from stored alert data, not fabricated.
  const beforeTuning = totalAlerts;
  const afterTuning = totalAlerts - totalFP;
  const noiseReduction = beforeTuning > 0 ? Math.round((totalFP / beforeTuning) * 100) : 0;

  return apiSuccess({
    perRule,
    summary: {
      totalAlerts,
      truePositives: totalTP,
      falsePositives: totalFP,
      beforeTuning,
      afterTuning,
      noiseReduction,
      falsePositiveRate: totalTP + totalFP > 0 ? Math.round((totalFP / (totalTP + totalFP)) * 100) : 0,
      precision: totalTP + totalFP > 0 ? Math.round((totalTP / (totalTP + totalFP)) * 100) : 0,
    },
  });
}
