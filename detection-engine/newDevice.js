import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";

/**
 * Triggers when a user logs in successfully from a device never seen
 * before in their baseline. Severity/points scale up if it's also a new
 * IP or new country - i.e. multiple weak signals stacking into one alert.
 */
export async function detectNewDevice(rule, event, userDoc) {
  if (event.eventType !== "LOGIN_SUCCESS" || !userDoc) return null;
  if (isExcluded(rule, event)) return null;

  const baseline = userDoc.baseline || {};
  const isNewDevice = !(baseline.knownDevices || []).includes(event.device);
  if (!isNewDevice) return null;

  const isNewIP = !(baseline.knownIPs || []).includes(event.sourceIP);
  const isNewCountry = !(baseline.knownCountries || []).includes(event.country);

  const riskFactors = [{ factor: "Login from new device", points: RISK_WEIGHTS.NEW_DEVICE }];
  if (isNewIP) riskFactors.push({ factor: "Also a new IP", points: RISK_WEIGHTS.NEW_IP });
  if (isNewCountry) riskFactors.push({ factor: "Also a new location", points: RISK_WEIGHTS.NEW_LOCATION });

  return createAlertOnce({
    rule,
    correlationKey: `NEW_DEVICE:${event.username}:${event._id}`,
    title: "New Device Login Detected",
    description: `${event.username} logged in from a previously unseen device (${event.device}, ${event.browser}/${event.operatingSystem})${
      isNewIP ? " and a new IP" : ""
    }.`,
    username: event.username,
    user: event.userId,
    sourceIP: event.sourceIP,
    evidence: [event._id],
    riskFactors,
    simulation: event.simulation,
  });
}
