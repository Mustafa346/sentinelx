import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulateNewDevice } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulateNewDevice, "New Device Login");
