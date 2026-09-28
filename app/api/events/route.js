import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import IdentityEvent from "@/models/IdentityEvent";

export async function GET(request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 25));

  const query = {};

  // Employees can only ever see their own login history - enforced
  // server-side regardless of what the frontend requests.
  if (user.role === "EMPLOYEE") {
    query.userId = user._id;
  } else if (searchParams.get("username")) {
    query.username = searchParams.get("username");
  }

  if (searchParams.get("eventType")) query.eventType = searchParams.get("eventType");
  if (searchParams.get("result")) query.result = searchParams.get("result");
  if (searchParams.get("sourceIP")) query.sourceIP = searchParams.get("sourceIP");
  if (searchParams.get("device")) query.device = searchParams.get("device");

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    query.timestamp = {};
    if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
    if (dateTo) query.timestamp.$lte = new Date(dateTo);
  }

  const [events, total] = await Promise.all([
    IdentityEvent.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    IdentityEvent.countDocuments(query),
  ]);

  return apiSuccess({ events, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
