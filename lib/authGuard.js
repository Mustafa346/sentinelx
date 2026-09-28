import { NextResponse } from "next/server";
import { getSessionFromCookies } from "./session";
import { connectDB } from "./db";
import User from "@/models/User";

/**
 * Standard API error envelope used everywhere so the frontend can handle
 * failures consistently, and so we never leak stack traces to the client.
 */
export function apiError(message, code, status) {
  return NextResponse.json({ success: false, message, error: code }, { status });
}

export function apiSuccess(data, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

/**
 * Loads the current session + fresh user document from the DB (so a
 * disabled/deleted user's old token stops working immediately), and
 * optionally enforces a role allow-list. Returns either
 * { user } or { errorResponse } - callers must check which.
 */
export async function requireAuth(allowedRoles = null) {
  const session = await getSessionFromCookies();
  if (!session) {
    return { errorResponse: apiError("Authentication required", "AUTH_REQUIRED", 401) };
  }

  await connectDB();
  const user = await User.findById(session.sub);

  if (!user || user.status !== "ACTIVE") {
    return { errorResponse: apiError("Account is not active", "ACCOUNT_INACTIVE", 401) };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { errorResponse: apiError("Insufficient permissions", "FORBIDDEN", 403) };
  }

  return { user, session };
}
