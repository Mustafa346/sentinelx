import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE || 28800); // seconds
export const SESSION_COOKIE_NAME = "sentinelx_session";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined. Set it in .env.local");
}

/**
 * Signs a compact session token. We only ever put non-sensitive identifiers
 * in the token (id, role) - never password hashes or PII beyond username.
 */
export function signSession(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE });
}

export function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Reads and verifies the session cookie inside a Server Component / Route Handler. */
export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
