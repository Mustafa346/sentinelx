import IdentityEvent from "@/models/IdentityEvent";
import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";

/**
 * Triggers whenever a ROLE_CHANGED / PRIVILEGE_ESCALATED event grants a
 * more privileged role (e.g. EMPLOYEE -> ADMIN), especially if it happened
 * shortly after a suspicious authentication event for the same user.
 */
const ROLE_RANK = { EMPLOYEE: 0, SECURITY_ANALYST: 1, ADMIN: 2 };

export async function detectPrivilegeEscalation(rule, event) {
  if (!["ROLE_CHANGED", "PRIVILEGE_ESCALATED"].includes(event.eventType)) return null;
  if (isExcluded(rule, event)) return null;

  const prevRank = ROLE_RANK[event.previousRole] ?? 0;
  const newRank = ROLE_RANK[event.newRole] ?? 0;
  if (newRank <= prevRank) return null; // not an escalation

  const windowStart = new Date(event.timestamp.getTime() - rule.timeWindowMinutes * 60_000);

  const recentAuthEvents = await IdentityEvent.find({
    username: event.username,
    eventType: { $in: ["LOGIN_FAILURE", "NEW_IP", "NEW_DEVICE", "MFA_RESET"] },
    timestamp: { $gte: windowStart, $lte: event.timestamp },
  });

  const precededBySuspiciousAuth = recentAuthEvents.length > 0;
  const severity = event.newRole === "ADMIN" ? "CRITICAL" : rule.severity;

  const riskFactors = [
    { factor: `Role escalated ${event.previousRole} -> ${event.newRole}`, points: RISK_WEIGHTS.PRIVILEGE_ESCALATION },
  ];
  if (precededBySuspiciousAuth) {
    riskFactors.push({
      factor: "Escalation followed suspicious authentication activity",
      points: RISK_WEIGHTS.MULTIPLE_SUSPICIOUS_EVENTS * 2,
    });
  }

  return createAlertOnce({
    rule: { ...rule.toObject(), severity },
    correlationKey: `PRIV_ESC:${event.username}:${event._id}`,
    title: "Privilege Escalation Detected",
    description: `${event.username} was escalated from ${event.previousRole} to ${event.newRole}${
      precededBySuspiciousAuth ? " shortly after suspicious authentication activity" : ""
    }.`,
    username: event.username,
    user: event.userId,
    sourceIP: event.sourceIP,
    evidence: [event._id, ...recentAuthEvents.map((e) => e._id)],
    riskFactors,
    simulation: event.simulation,
  });
}
