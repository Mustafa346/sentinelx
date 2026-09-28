import IdentityEvent from "@/models/IdentityEvent";
import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";

/**
 * The "correlation across multiple events" detection required by the
 * spec: new IP + new device + multiple failed logins + a successful login
 * + an MFA change, all for the same user within the time window.
 */
export async function detectAccountTakeover(rule, event, userDoc) {
  if (event.eventType !== "LOGIN_SUCCESS" || !userDoc) return null;
  if (isExcluded(rule, event)) return null;

  const windowStart = new Date(event.timestamp.getTime() - rule.timeWindowMinutes * 60_000);

  const recent = await IdentityEvent.find({
    username: event.username,
    timestamp: { $gte: windowStart, $lte: event.timestamp },
  }).sort({ timestamp: 1 });

  const baseline = userDoc.baseline || {};
  const failedLogins = recent.filter((e) => e.eventType === "LOGIN_FAILURE");
  const mfaChange = recent.find((e) => e.eventType === "MFA_RESET" || e.eventType === "MFA_REGISTERED");
  const isNewIP = !(baseline.knownIPs || []).includes(event.sourceIP);
  const isNewDevice = !(baseline.knownDevices || []).includes(event.device);

  const signals = [
    isNewIP && "new IP",
    isNewDevice && "new device",
    failedLogins.length > 0 && `${failedLogins.length} failed logins`,
    "successful login",
    mfaChange && "MFA change",
  ].filter(Boolean);

  const requiredSignals = rule.threshold ?? 4; // default: need at least 4 of the 5 signals
  if (signals.length < requiredSignals) return null;

  const riskFactors = [
    { factor: "Successful login after suspicious activity", points: RISK_WEIGHTS.FAILED_LOGIN },
  ];
  if (isNewIP) riskFactors.push({ factor: "New IP", points: RISK_WEIGHTS.NEW_IP });
  if (isNewDevice) riskFactors.push({ factor: "New device", points: RISK_WEIGHTS.NEW_DEVICE });
  if (failedLogins.length) riskFactors.push({ factor: `${failedLogins.length} failed logins beforehand`, points: RISK_WEIGHTS.FAILED_LOGIN * Math.min(failedLogins.length, 5) });
  if (mfaChange) riskFactors.push({ factor: "MFA changed during the same window", points: RISK_WEIGHTS.MFA_RESET });

  const evidenceIds = [...recent.map((e) => e._id)];

  return createAlertOnce({
    rule,
    correlationKey: `ACCOUNT_TAKEOVER:${event.username}:${event._id}`,
    title: "Possible Account Takeover Detected",
    description: `${event.username}'s account shows a takeover pattern: ${signals.join(", ")} within ${rule.timeWindowMinutes} minutes.`,
    username: event.username,
    user: event.userId,
    sourceIP: event.sourceIP,
    evidence: evidenceIds,
    riskFactors,
    simulation: event.simulation,
  });
}
