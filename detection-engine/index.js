import DetectionRule from "@/models/DetectionRule";
import User from "@/models/User";
import { detectPasswordSpray } from "./passwordSpray";
import { detectMfaAbuse } from "./mfaAbuse";
import { detectPrivilegeEscalation } from "./privilegeEscalation";
import { detectUnusualAdminLogin } from "./unusualAdminLogin";
import { detectImpossibleTravel } from "./impossibleTravel";
import { detectNewDevice } from "./newDevice";
import { detectAccountTakeover } from "./accountTakeover";

const DETECTOR_MAP = {
  PASSWORD_SPRAY: detectPasswordSpray,
  MFA_ABUSE: detectMfaAbuse,
  PRIVILEGE_ESCALATION: detectPrivilegeEscalation,
  UNUSUAL_ADMIN_LOGIN: detectUnusualAdminLogin,
  IMPOSSIBLE_TRAVEL: detectImpossibleTravel,
  NEW_DEVICE: detectNewDevice,
  ACCOUNT_TAKEOVER: detectAccountTakeover,
};

// Detectors that need the full user document (for baseline comparison),
// not just the event itself.
const NEEDS_USER_DOC = new Set([
  "UNUSUAL_ADMIN_LOGIN",
  "NEW_DEVICE",
  "ACCOUNT_TAKEOVER",
]);

/**
 * Runs every ENABLED detection rule against a freshly created identity
 * event. This is step 3-10 of the "detection pipeline" (section 27):
 * retrieve relevant recent events (done inside each detector), check
 * thresholds, check exceptions, calculate risk, create alert + evidence +
 * MITRE mapping + notification + audit log (all inside createAlertOnce).
 *
 * Returns the list of alerts created or updated as a result of this event.
 */
export async function runDetectionPipeline(event) {
  const rules = await DetectionRule.find({ status: "ENABLED" });
  if (rules.length === 0) return [];

  let userDoc = null;
  if ([...NEEDS_USER_DOC].some((t) => rules.some((r) => r.detectionType === t))) {
    if (event.userId) {
      userDoc = await User.findById(event.userId);
    } else if (event.username) {
      userDoc = await User.findOne({ username: event.username });
    }
  }

  const results = [];

  for (const rule of rules) {
    const detector = DETECTOR_MAP[rule.detectionType];
    if (!detector) continue;

    try {
      const outcome = NEEDS_USER_DOC.has(rule.detectionType)
        ? await detector(rule, event, userDoc)
        : await detector(rule, event);

      if (outcome?.alert) {
        results.push(outcome);
      }
    } catch (err) {
      // A single detector failing should never take down event ingestion.
      console.error(`[detection-engine] ${rule.detectionType} failed:`, err.message);
    }
  }

  return results;
}
