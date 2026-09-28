import Alert from "@/models/Alert";
import { generateId } from "@/lib/utils";
import { computeRiskScore } from "@/lib/riskScoring";
import { isExcluded } from "@/lib/exclusions";
import { createNotification, writeAuditLog } from "@/services/auditLog";

export { isExcluded };


/**
 * Creates an alert unless an open (non-closed/non-resolved) alert already
 * exists for the same correlation key - this is the basic deduplication /
 * correlation logic requested in the spec so re-running a simulation
 * doesn't spam duplicate alerts for the exact same in-progress pattern.
 */
export async function createAlertOnce({
  rule,
  correlationKey,
  title,
  description,
  user = null,
  username = null,
  sourceIP = null,
  evidence = [],
  riskFactors = [],
  simulation = null,
}) {
  const existing = await Alert.findOne({
    correlationKey,
    status: { $nin: ["RESOLVED", "CLOSED", "FALSE_POSITIVE"] },
  });

  if (existing) {
    // Correlate: attach any new evidence rather than creating a duplicate alert
    const newEvidence = evidence.filter(
      (id) => !existing.evidence.some((e) => e.toString() === id.toString())
    );
    if (newEvidence.length) {
      existing.evidence.push(...newEvidence);
      await existing.save();
    }
    return { alert: existing, created: false };
  }

  const { score, factors } = computeRiskScore(riskFactors);

  const alert = await Alert.create({
    alertId: generateId("ALT"),
    title,
    description,
    severity: rule.severity,
    detectionRule: rule._id,
    detectionType: rule.detectionType,
    user,
    username,
    sourceIP,
    timestamp: new Date(),
    status: "NEW",
    riskScore: score,
    riskFactors: factors,
    mitreTechniqueId: rule.mitreTechniqueId,
    mitreTechniqueName: rule.mitreTechniqueName,
    evidence,
    correlationKey,
    simulation: simulation || { isSimulated: false },
  });

  await createNotification({
    audienceRoles: ["ADMIN", "SECURITY_ANALYST"],
    title: `${rule.severity} - ${title}`,
    message: description,
    severity: rule.severity,
    relatedAlert: alert._id,
  });

  await writeAuditLog({
    actorUsername: "detection-engine",
    action: "ALERT_CREATED",
    target: alert.alertId,
    targetType: "Alert",
    description: `${rule.name} triggered: ${description}`,
    ip: sourceIP,
  });

  return { alert, created: true };
}
