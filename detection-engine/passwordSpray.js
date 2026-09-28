import IdentityEvent from "@/models/IdentityEvent";
import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";

/**
 * Triggers when the same source IP has produced >= threshold failed logins
 * against >= distinctUserThreshold different usernames within the rule's
 * time window.
 */
export async function detectPasswordSpray(rule, event) {
  if (event.eventType !== "LOGIN_FAILURE" || !event.sourceIP) return null;
  if (isExcluded(rule, event)) return null;

  const windowStart = new Date(
    event.timestamp.getTime() - rule.timeWindowMinutes * 60_000
  );

  const recentFailures = await IdentityEvent.find({
    sourceIP: event.sourceIP,
    eventType: "LOGIN_FAILURE",
    timestamp: { $gte: windowStart, $lte: event.timestamp },
  }).sort({ timestamp: 1 });

  const distinctUsers = new Set(recentFailures.map((e) => e.username));

  const threshold = rule.threshold ?? 5;
  const distinctThreshold = rule.distinctUserThreshold ?? 3;

  if (recentFailures.length < threshold || distinctUsers.size < distinctThreshold) {
    return null;
  }

  const evidenceIds = recentFailures.map((e) => e._id);

  const riskFactors = [
    { factor: "Multiple failed logins from one source", points: RISK_WEIGHTS.FAILED_LOGIN * Math.min(recentFailures.length, 5) },
    { factor: `Password spray pattern across ${distinctUsers.size} accounts`, points: RISK_WEIGHTS.MULTIPLE_SUSPICIOUS_EVENTS * distinctUsers.size },
  ];

  return createAlertOnce({
    rule,
    correlationKey: `PASSWORD_SPRAY:${event.sourceIP}`,
    title: "Password Spray Detected",
    description: `${recentFailures.length} failed logins against ${distinctUsers.size} distinct users from ${event.sourceIP} within ${rule.timeWindowMinutes} minutes.`,
    sourceIP: event.sourceIP,
    evidence: evidenceIds,
    riskFactors,
    simulation: event.simulation,
  });
}
