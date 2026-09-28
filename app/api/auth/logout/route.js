import { getSessionFromCookies, clearSessionCookie } from "@/lib/session";
import { apiSuccess } from "@/lib/authGuard";
import { connectDB } from "@/lib/db";
import { getRequestIP, parseUserAgent } from "@/lib/utils";
import { recordIdentityEvent } from "@/services/eventPipeline";
import { writeAuditLog } from "@/services/auditLog";

export async function POST(request) {
  const session = await getSessionFromCookies();

  if (session) {
    await connectDB();
    const ua = parseUserAgent(request.headers.get("user-agent") || "");
    await recordIdentityEvent({
      userId: session.sub,
      username: session.username,
      eventType: "LOGOUT",
      result: "INFO",
      sourceIP: getRequestIP(request),
      device: ua.device,
      browser: ua.browser,
      operatingSystem: ua.os,
    });

    await writeAuditLog({
      actor: session.sub,
      actorUsername: session.username,
      action: "LOGOUT",
      target: session.username,
      targetType: "User",
      ip: getRequestIP(request),
    });
  }

  await clearSessionCookie();
  return apiSuccess({ message: "Logged out" });
}
