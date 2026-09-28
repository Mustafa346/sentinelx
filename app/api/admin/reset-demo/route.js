import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import IdentityEvent from "@/models/IdentityEvent";
import Alert from "@/models/Alert";
import { writeAuditLog } from "@/services/auditLog";

export async function POST() {
  const { user, errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();

  const [eventsResult, alertsResult] = await Promise.all([
    IdentityEvent.deleteMany({ "simulation.isSimulated": true }),
    Alert.deleteMany({ "simulation.isSimulated": true }),
  ]);

  await writeAuditLog({
    actor: user._id,
    actorUsername: user.username,
    action: "DEMO_DATA_CLEARED",
    description: `Removed ${eventsResult.deletedCount} simulated events and ${alertsResult.deletedCount} simulated alerts.`,
  });

  return apiSuccess({
    message: "Simulated demo data cleared. Seed data and real activity were not affected.",
    eventsRemoved: eventsResult.deletedCount,
    alertsRemoved: alertsResult.deletedCount,
  });
}
