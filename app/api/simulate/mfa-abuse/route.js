import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulateMfaAbuse } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulateMfaAbuse, "MFA Abuse");
