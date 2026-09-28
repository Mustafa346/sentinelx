"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

const DEPARTMENTS = ["IT", "Finance", "HR", "Security", "Engineering", "Management"];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", department: "IT" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: form });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
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
            Create your account
          </h1>
          <p className="text-sm" style={{ color: "var(--sx-text-dim)" }}>
            Registers as an Employee. Roles are elevated by an admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="sx-card p-6 space-y-3">
          <input className="sx-input" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          <input className="sx-input" placeholder="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          <input className="sx-input" placeholder="Username" value={form.username} onChange={(e) => update("username", e.target.value)} required />
          <select className="sx-input" value={form.department} onChange={(e) => update("department", e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            className="sx-input"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
          <p className="text-[11px]" style={{ color: "var(--sx-text-dim)" }}>
            8+ characters, with an uppercase letter, a lowercase letter, and a number.
          </p>

          {error && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(244,63,94,0.1)", color: "var(--sx-critical)" }}>
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(74,222,128,0.1)", color: "var(--sx-low)" }}>
              Account created! Redirecting to login...
            </div>
          )}

          <button type="submit" className="sx-btn sx-btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--sx-text-dim)" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "var(--sx-accent)" }}>
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
