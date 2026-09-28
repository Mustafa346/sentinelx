"use client";

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("Unexpected server response", "PARSE_ERROR", res.status);
  }

  if (!res.ok || data.success === false) {
    throw new ApiError(data.message || "Request failed", data.error || "UNKNOWN", res.status);
  }

  return data;
}
