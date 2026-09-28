import { connectDB } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/authGuard";
import { writeAuditLog } from "@/services/auditLog";

/**
 * Wraps a simulator function into a standard POST route handler. Only
 * ADMIN and SECURITY_ANALYST can trigger simulations. Every run is
 * audit-logged, and the response always reminds the caller this is a
 * local-only simulation.
 */
export function makeSimulationRoute(simulatorFn, label) {
  return async function POST() {
    const { user, errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
    if (errorResponse) return errorResponse;

    await connectDB();

    try {
      const result = await simulatorFn();

      await writeAuditLog({
        actor: user._id,
        actorUsername: user.username,
        action: "ATTACK_SIMULATION_RUN",
        target: label,
        targetType: "Simulation",
        description: `${label} simulation run - ${result.eventsGenerated} events generated, ${result.alertsCreated.length} alert(s) created/updated.`,
      });

      return apiSuccess({
        message: `${label} simulation complete. This generated synthetic events only - no external systems were contacted.`,
        notice: "Simulation only - no external systems are being attacked.",
        ...result,
      });
    } catch (err) {
      return apiError(err.message || "Simulation failed", "SIMULATION_ERROR", 400);
    }
  };
}
