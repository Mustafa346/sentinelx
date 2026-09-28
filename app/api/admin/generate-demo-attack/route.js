import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import { writeAuditLog } from "@/services/auditLog";
import {
  simulatePasswordSpray,
  simulateMfaAbuse,
  simulatePrivilegeEscalation,
  simulateUnusualAdminLogin,
  simulateImpossibleTravel,
  simulateNewDevice,
  simulateSuspiciousNewIP,
  simulateAccountTakeover,
} from "@/services/attackSimulator";

const SCENARIOS = [
  ["Password Spray", simulatePasswordSpray],
  ["MFA Abuse", simulateMfaAbuse],
  ["Privilege Escalation", simulatePrivilegeEscalation],
  ["Unusual Admin Login", simulateUnusualAdminLogin],
  ["Impossible Travel", simulateImpossibleTravel],
  ["New Device Login", simulateNewDevice],
  ["Suspicious Login From New IP", simulateSuspiciousNewIP],
  ["Account Takeover", simulateAccountTakeover],
];

export async function POST() {
  const { user, errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();

  const [label, fn] = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

  try {
    const result = await fn();
    await writeAuditLog({
      actor: user._id,
      actorUsername: user.username,
      action: "ATTACK_SIMULATION_RUN",
      target: label,
      targetType: "Simulation",
      description: `Random demo attack: ${label}`,
    });
    return apiSuccess({ scenario: label, ...result });
  } catch (err) {
    return apiError(err.message, "SIMULATION_ERROR", 400);
  }
}
