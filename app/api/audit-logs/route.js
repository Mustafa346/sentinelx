import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import AuditLog from "@/models/AuditLog";

export async function GET(request) {
  const { errorResponse } = await requireAuth(["ADMIN"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 30));

  const query = {};
  if (searchParams.get("action")) query.action = searchParams.get("action");
  if (searchParams.get("actorUsername")) query.actorUsername = searchParams.get("actorUsername");

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    AuditLog.countDocuments(query),
  ]);

  return apiSuccess({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
