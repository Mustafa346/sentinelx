import crypto from "crypto";

export function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Very small, dependency-free UA parser. It's not meant to be exhaustive -
 * just good enough to produce realistic-looking device/browser/OS fields
 * for identity events without pulling in an external library.
 */
export function parseUserAgent(uaString = "") {
  const ua = uaString || "";
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) {
    os = "Android";
    device = "Mobile";
  } else if (/iphone|ipad/i.test(ua)) {
    os = "iOS";
    device = "Mobile";
  } else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, os, device };
}

export function getRequestIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export function isOffHours(date, startHour = 8, endHour = 18) {
  const hour = date.getHours();
  return hour < startHour || hour >= endHour;
}
