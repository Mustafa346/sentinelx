import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

export async function writeAuditLog({
  actor = null,
  actorUsername = "system",
  action,
  target = null,
  targetType = null,
  description = "",
  ip = null,
}) {
  return AuditLog.create({
    actor,
    actorUsername,
    action,
    target,
    targetType,
    description,
    ip,
    timestamp: new Date(),
  });
}

export async function createNotification({
  recipient = null,
  audienceRoles = [],
  title,
  message,
  severity = "INFO",
  relatedAlert = null,
}) {
  return Notification.create({
    recipient,
    audienceRoles,
    title,
    message,
    severity,
    relatedAlert,
  });
}
