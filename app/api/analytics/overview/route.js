import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import Alert from "@/models/Alert";
import IdentityEvent from "@/models/IdentityEvent";
import DetectionRule from "@/models/DetectionRule";
import User from "@/models/User";

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60_000);
}

export async function GET(request) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const since = daysAgo(14);

  const [
    totalEvents,
    totalAlerts,
    criticalAlerts,
    highAlerts,
    openIncidents,
    falsePositives,
    truePositives,
    ruleCount,
    activeUsers,
    alertsBySeverity,
    alertsByType,
    topUsers,
    topIPs,
    eventsOverTime,
    alertsOverTime,
    recentAlerts,
  ] = await Promise.all([
    IdentityEvent.countDocuments({}),
    Alert.countDocuments({}),
    Alert.countDocuments({ severity: "CRITICAL" }),
    Alert.countDocuments({ severity: "HIGH" }),
    Alert.countDocuments({ status: { $nin: ["RESOLVED", "CLOSED", "FALSE_POSITIVE"] } }),
    Alert.countDocuments({ status: "FALSE_POSITIVE" }),
    Alert.countDocuments({ status: "TRUE_POSITIVE" }),
    DetectionRule.countDocuments({ status: "ENABLED" }),
    User.countDocuments({ status: "ACTIVE" }),
    Alert.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
    Alert.aggregate([{ $group: { _id: "$detectionType", count: { $sum: 1 } } }]),
    Alert.aggregate([
      { $match: { username: { $ne: null } } },
      { $group: { _id: "$username", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Alert.aggregate([
      { $match: { sourceIP: { $ne: null } } },
      { $group: { _id: "$sourceIP", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    IdentityEvent.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Alert.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Alert.find({}).sort({ createdAt: -1 }).limit(8).select("alertId title severity status createdAt username sourceIP"),
  ]);

  const totalTriaged = truePositives + falsePositives;
  const falsePositiveRate = totalTriaged > 0 ? Math.round((falsePositives / totalTriaged) * 100) : 0;
  const precision = totalTriaged > 0 ? Math.round((truePositives / totalTriaged) * 100) : 0;

  return apiSuccess({
    stats: {
      totalEvents,
      totalAlerts,
      criticalAlerts,
      highAlerts,
      openIncidents,
      falsePositives,
      truePositives,
      detectionRules: ruleCount,
      activeUsers,
      falsePositiveRate,
      precision,
    },
    alertsBySeverity: alertsBySeverity.map((a) => ({ severity: a._id, count: a.count })),
    alertsByType: alertsByType.map((a) => ({ type: a._id, count: a.count })),
    topUsers: topUsers.map((u) => ({ username: u._id, count: u.count })),
    topIPs: topIPs.map((i) => ({ ip: i._id, count: i.count })),
    eventsOverTime: eventsOverTime.map((e) => ({ date: e._id, count: e.count })),
    alertsOverTime: alertsOverTime.map((a) => ({ date: a._id, count: a.count })),
    recentAlerts,
  });
}
