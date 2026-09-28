import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import Notification from "@/models/Notification";

export async function GET() {
  const { user, errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();

  const notifications = await Notification.find({
    $or: [{ recipient: user._id }, { audienceRoles: user.role }],
  })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return apiSuccess({ notifications, unreadCount });
}

export async function PATCH(request) {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.markAllRead) {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
  } else if (body.id) {
    await Notification.updateOne({ _id: body.id }, { $set: { isRead: true } });
  }

  return apiSuccess({ message: "Updated" });
}
