import IdentityEvent from "@/models/IdentityEvent";
import { isExcluded, createAlertOnce } from "./common";
import { RISK_WEIGHTS } from "@/lib/riskScoring";

/**
 * Triggers when the same user has two successful logins from different
 * countries within an implausibly short time window. No external
 * geolocation API is used - we simply compare the stored country field
 * between consecutive successful logins.
 */
export async function detectImpossibleTravel(rule, event) {
  if (event.eventType !== "LOGIN_SUCCESS" || !event.username) return null;
  if (isExcluded(rule, event)) return null;

  const windowStart = new Date(event.timestamp.getTime() - rule.timeWindowMinutes * 60_000);

  const previousLogin = await IdentityEvent.findOne({
    username: event.username,
    eventType: "LOGIN_SUCCESS",
    timestamp: { $gte: windowStart, $lt: event.timestamp },
  }).sort({ timestamp: -1 });

  if (!previousLogin) return null;
  if (previousLogin.country === event.country) return null;

  const minutesApart = Math.round(
    (event.timestamp.getTime() - previousLogin.timestamp.getTime()) / 60000
  );

  const riskFactors = [
    { factor: `Login from ${previousLogin.country} then ${event.country} in ${minutesApart} min`, points: RISK_WEIGHTS.NEW_LOCATION * 2 },
  ];

  return createAlertOnce({
    rule,
    correlationKey: `IMPOSSIBLE_TRAVEL:${event.username}:${event._id}`,
    title: "Impossible Travel Detected",
    description: `${event.username} logged in from ${previousLogin.country} (${previousLogin.city}) and then from ${event.country} (${event.city}) only ${minutesApart} minutes later.`,
    username: event.username,
    user: event.userId,
    sourceIP: event.sourceIP,
    evidence: [previousLogin._id, event._id],
    riskFactors,
    simulation: event.simulation,
  });
}
