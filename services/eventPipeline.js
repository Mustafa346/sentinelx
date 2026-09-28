import IdentityEvent from "@/models/IdentityEvent";
import User from "@/models/User";
import { generateId } from "@/lib/utils";
import { runDetectionPipeline } from "@/detection-engine";

/**
 * Records a single identity event and immediately runs it through the
 * detection engine. This is the one place in the app that should be used
 * to create IdentityEvent documents, so every code path (real auth,
 * attack simulator, admin actions) produces consistent, fully-analyzed
 * telemetry - matching the "detection pipeline" described in section 27.
 */
export async function recordIdentityEvent(fields) {
  const event = await IdentityEvent.create({
    eventId: generateId("EVT"),
    timestamp: new Date(),
    ...fields,
  });

  // IMPORTANT: run detection BEFORE updating the baseline, otherwise a
  // first-time login from a new device/IP would immediately get added to
  // the baseline and the "new device" detector would never see it as new.
  const alertOutcomes = await runDetectionPipeline(event);

  // Update the user's behavioral baseline for successful logins so future
  // detections (new device/IP/location) have something to compare against.
  if (event.eventType === "LOGIN_SUCCESS" && event.userId) {
    await updateBaseline(event);
  }

  return { event, alertOutcomes };
}

async function updateBaseline(event) {
  const update = {};
  const addToSet = {};

  if (event.sourceIP) addToSet["baseline.knownIPs"] = event.sourceIP;
  if (event.device) addToSet["baseline.knownDevices"] = event.device;
  if (event.country) addToSet["baseline.knownCountries"] = event.country;

  if (Object.keys(addToSet).length) {
    await User.updateOne(
      { _id: event.userId },
      {
        $addToSet: addToSet,
        $set: { lastLogin: event.timestamp, ...update },
      }
    );
  }
}
