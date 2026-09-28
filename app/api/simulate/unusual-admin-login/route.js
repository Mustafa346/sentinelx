import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulateUnusualAdminLogin } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulateUnusualAdminLogin, "Unusual Admin Login");
