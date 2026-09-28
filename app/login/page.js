"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";

const DEMO_ACCOUNTS = [
  { role: "Admin", username: "admin" },
  { role: "Security Analyst", username: "analyst" },
  { role: "Employee", username: "employee" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: { username, password } });
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--sx-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <ShieldAlert size={36} color="var(--sx-accent)" />
          <h1 className="mt-3 text-xl font-bold" style={{ color: "var(--sx-text)" }}>
            SentinelX
          </h1>
          <p className="text-sm" style={{ color: "var(--sx-text-dim)" }}>
            Identity Threat Detection &amp; Response
          </p>
        </div>

        <form onSubmit={handleSubmit} className="sx-card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--sx-text-dim)" }}>
              Username or email
            </label>
            <input
              className="sx-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--sx-text-dim)" }}>
              Password
            </label>
            <input
              type="password"
              className="sx-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(244,63,94,0.1)", color: "var(--sx-critical)" }}>
              {error}
            </div>
          )}

          <button type="submit" className="sx-btn sx-btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Log in"}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--sx-text-dim)" }}>
            No account?{" "}
            <a href="/register" style={{ color: "var(--sx-accent)" }}>
              Register
            </a>
          </p>
        </form>

        <div className="sx-card p-4 mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--sx-text-dim)" }}>
            Demo credentials
          </p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.username} className="flex justify-between text-xs">
                <span style={{ color: "var(--sx-text-dim)" }}>{a.role}</span>
                <span style={{ color: "var(--sx-text)" }} className="font-mono">
                  {a.username} / Passw0rd!
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
