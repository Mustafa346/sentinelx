import IdentityEvent from "@/models/IdentityEvent";
import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";

/**
 * Triggers on:
 *  - multiple MFA resets for the same user in the time window, OR
 *  - an MFA reset/registration immediately followed by (or following) a
 *    successful login for the same user - a classic MFA-abuse / account
 *    takeover precursor pattern.
 */
export async function detectMfaAbuse(rule, event) {
  if (!["MFA_RESET", "MFA_REGISTERED", "LOGIN_SUCCESS"].includes(event.eventType)) {
    return null;
  }
  if (isExcluded(rule, event)) return null;
  if (!event.username) return null;

  const windowStart = new Date(
    event.timestamp.getTime() - rule.timeWindowMinutes * 60_000
  );

  const recent = await IdentityEvent.find({
    username: event.username,
    eventType: { $in: ["MFA_RESET", "MFA_REGISTERED", "LOGIN_SUCCESS", "LOGIN_FAILURE"] },
    timestamp: { $gte: windowStart, $lte: event.timestamp },
  }).sort({ timestamp: 1 });

  const mfaResets = recent.filter((e) => e.eventType === "MFA_RESET");
  const hasSuccessfulLogin = recent.some((e) => e.eventType === "LOGIN_SUCCESS");

  const multipleResets = mfaResets.length >= (rule.threshold ?? 2);
  const resetThenLogin = mfaResets.length >= 1 && hasSuccessfulLogin;

  if (!multipleResets && !resetThenLogin) return null;

  const evidenceIds = recent.map((e) => e._id);

  const riskFactors = [
    { factor: "MFA reset activity", points: RISK_WEIGHTS.MFA_RESET },
  ];
  if (multipleResets) {
    riskFactors.push({
      factor: `${mfaResets.length} MFA resets in short window`,
      points: RISK_WEIGHTS.MULTIPLE_SUSPICIOUS_EVENTS * mfaResets.length,
    });
  }
  if (resetThenLogin) {
    riskFactors.push({
      factor: "MFA reset followed by successful login",
      points: RISK_WEIGHTS.MULTIPLE_SUSPICIOUS_EVENTS * 2,
    });
  }

  return createAlertOnce({
    rule,
    correlationKey: `MFA_ABUSE:${event.username}`,
    title: "Suspicious MFA Activity Detected",
    description: multipleResets
      ? `${mfaResets.length} MFA resets for ${event.username} within ${rule.timeWindowMinutes} minutes.`
      : `MFA reset for ${event.username} followed by a successful login within ${rule.timeWindowMinutes} minutes.`,
    username: event.username,
    user: event.userId,
    sourceIP: event.sourceIP,
    evidence: evidenceIds,
    riskFactors,
    simulation: event.simulation,
  });
}
