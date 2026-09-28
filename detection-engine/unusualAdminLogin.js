import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";
import { isOffHours } from "@/lib/utils";

/**
 * Triggers when an admin logs in outside normal business hours, from an IP
 * not in their known baseline, or from a device not in their known baseline.
 */
export async function detectUnusualAdminLogin(rule, event, adminUser) {
  if (event.eventType !== "LOGIN_SUCCESS") return null;
  if (!adminUser || adminUser.role !== "ADMIN") return null;
  if (isExcluded(rule, event)) return null;

  const baseline = adminUser.baseline || {};
  const reasons = [];
  const riskFactors = [];

  const offHours = isOffHours(
    event.timestamp,
    baseline.normalLoginHourStart ?? 8,
    baseline.normalLoginHourEnd ?? 18
  );
  if (offHours) {
    reasons.push("outside normal business hours");
    riskFactors.push({ factor: "Admin login outside business hours", points: RISK_WEIGHTS.OFF_HOURS_ADMIN_LOGIN });
  }

  const knownIP = (baseline.knownIPs || []).includes(event.sourceIP);
  if (!knownIP) {
    reasons.push("from a new/unrecognized IP");
    riskFactors.push({ factor: "Admin login from new IP", points: RISK_WEIGHTS.NEW_IP });
  }

  const knownDevice = (baseline.knownDevices || []).includes(event.device);
  if (!knownDevice) {
    reasons.push("from a new/unrecognized device");
    riskFactors.push({ factor: "Admin login from new device", points: RISK_WEIGHTS.NEW_DEVICE });
  }

  const knownCountry = (baseline.knownCountries || []).includes(event.country);
  if (!knownCountry) {
    reasons.push("from an unusual location");
    riskFactors.push({ factor: "Admin login from unusual location", points: RISK_WEIGHTS.NEW_LOCATION });
  }

  if (reasons.length === 0) return null;

  return createAlertOnce({
    rule,
    correlationKey: `UNUSUAL_ADMIN_LOGIN:${event.username}:${event._id}`,
    title: "Unusual Admin Login Detected",
    description: `Admin ${event.username} logged in ${reasons.join(", ")}.`,
    username: event.username,
    user: event.userId,
    sourceIP: event.sourceIP,
    evidence: [event._id],
    riskFactors,
    simulation: event.simulation,
  });
}
