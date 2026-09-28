import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulateAccountTakeover } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulateAccountTakeover, "Account Takeover");
