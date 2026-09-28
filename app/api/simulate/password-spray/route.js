import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulatePasswordSpray } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulatePasswordSpray, "Password Spray");
