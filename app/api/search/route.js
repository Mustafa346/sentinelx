import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import User from "@/models/User";
import Alert from "@/models/Alert";
import IdentityEvent from "@/models/IdentityEvent";
import DetectionRule from "@/models/DetectionRule";

export async function GET(request) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return apiSuccess({ results: { Users: [], Alerts: [], "Detection Rules": [], "Source IPs": [], Events: [] } });
  }

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [users, alerts, rules, ipEvents] = await Promise.all([
    User.find({ $or: [{ name: regex }, { username: regex }, { email: regex }] }).limit(5),
    Alert.find({ $or: [{ title: regex }, { alertId: regex }, { username: regex }] }).limit(5),
    DetectionRule.find({ $or: [{ name: regex }, { ruleId: regex }] }).limit(5),
    IdentityEvent.find({ sourceIP: regex }).limit(5),
  ]);

  const uniqueIPs = [...new Set(ipEvents.map((e) => e.sourceIP))];

  return apiSuccess({
    results: {
      Users: users.map((u) => ({ id: u._id, label: `${u.name} (${u.username})`, href: `/users` })),
      Alerts: alerts.map((a) => ({ id: a._id, label: `${a.alertId} - ${a.title}`, href: `/alerts/${a.alertId}` })),
      "Detection Rules": rules.map((r) => ({ id: r._id, label: `${r.name}`, href: `/detections` })),
      "Source IPs": uniqueIPs.map((ip) => ({ id: ip, label: ip, href: `/events?sourceIP=${ip}` })),
      Events: [],
    },
  });
}
