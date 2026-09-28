import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulatePrivilegeEscalation } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulatePrivilegeEscalation, "Privilege Escalation");
