import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulateImpossibleTravel } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulateImpossibleTravel, "Impossible Travel");
