import { makeSimulationRoute } from "@/lib/simulateRouteFactory";
import { simulateSuspiciousNewIP } from "@/services/attackSimulator";
export const POST = makeSimulationRoute(simulateSuspiciousNewIP, "Suspicious Login From New IP");
