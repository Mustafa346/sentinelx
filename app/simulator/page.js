"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldOff,
  ArrowUpCircle,
  UserCog,
  Plane,
  Smartphone,
  Globe2,
  Skull,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";

const SCENARIOS = [
  {
    key: "password-spray",
    title: "Password Spray",
    description: "Many failed logins against many users from one source IP, ending in one successful login.",
    icon: KeyRound,
  },
  {
    key: "mfa-abuse",
    title: "MFA Abuse",
    description: "Repeated MFA resets for one user followed by a successful login.",
    icon: ShieldOff,
  },
  {
    key: "privilege-escalation",
    title: "Privilege Escalation",
    description: "An employee role is unexpectedly escalated to Admin after a failed login attempt.",
    icon: ArrowUpCircle,
  },
  {
    key: "unusual-admin-login",
    title: "Unusual Admin Login",
    description: "An admin logs in off-hours from a new device, IP, and location.",
    icon: UserCog,
  },
  {
    key: "impossible-travel",
    title: "Impossible Travel",
    description: "The same user logs in from Pakistan, then from the US five minutes later.",
    icon: Plane,
  },
  {
    key: "new-device",
    title: "New Device Login",
    description: "A user logs in successfully from a device never seen before.",
    icon: Smartphone,
  },
  {
    key: "new-ip",
    title: "Suspicious Login From New IP",
    description: "A user logs in successfully from an unfamiliar, high-risk IP range.",
    icon: Globe2,
  },
  {
    key: "account-takeover",
    title: "Account Takeover Simulation",
    description: "Correlates new IP + new device + failed logins + successful login + MFA change.",
    icon: Skull,
  },
];

export default function SimulatorPage() {
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});

  async function runScenario(key) {
    setRunning(key);
    setErrors((e) => ({ ...e, [key]: null }));
    try {
      const data = await apiFetch(`/api/simulate/${key}`, { method: "POST" });
      setResults((r) => ({ ...r, [key]: data }));
    } catch (err) {
      setErrors((e) => ({ ...e, [key]: err.message }));
    } finally {
      setRunning(null);
    }
  }

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title="Attack Simulator"
      subtitle="Generates realistic identity events locally to exercise the detection engine"
    >
      <div className="sx-card p-3 mb-6 flex items-center gap-2" style={{ background: "rgba(250,204,21,0.08)", borderColor: "rgba(250,204,21,0.3)" }}>
        <AlertTriangle size={16} color="var(--sx-medium)" />
        <span className="text-sm" style={{ color: "var(--sx-medium)" }}>
          Simulation only - no external systems are being attacked. All events are generated and stored locally in MongoDB.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          const result = results[s.key];
          const error = errors[s.key];
          return (
            <div key={s.key} className="sx-card p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(34,211,238,0.1)", color: "var(--sx-accent)" }}
                >
                  <Icon size={17} />
                </div>
                <div className="font-semibold text-sm" style={{ color: "var(--sx-text)" }}>
                  {s.title}
                </div>
              </div>
              <p className="text-xs flex-1 mb-3" style={{ color: "var(--sx-text-dim)" }}>
                {s.description}
              </p>

              <button
                className="sx-btn sx-btn-primary w-full"
                disabled={running === s.key}
                onClick={() => runScenario(s.key)}
              >
                {running === s.key ? <Loader2 size={14} className="animate-spin" /> : "Run Simulation"}
              </button>

              {error && (
                <div className="mt-2 text-xs" style={{ color: "var(--sx-critical)" }}>
                  {error}
                </div>
              )}
              {result && (
                <div className="mt-3 text-xs rounded-lg p-2 space-y-1" style={{ background: "var(--sx-panel-2)" }}>
                  <div style={{ color: "var(--sx-text)" }}>
                    {result.eventsGenerated} event(s) generated
                  </div>
                  <div style={{ color: result.alertsCreated.length ? "var(--sx-high)" : "var(--sx-text-dim)" }}>
                    {result.alertsCreated.length
                      ? `${result.alertsCreated.length} alert(s) triggered`
                      : "No alert triggered (below threshold or excluded)"}
                  </div>
                  {result.alertsCreated.map((a) => (
                    <a key={a.alertId} href={`/alerts/${a.alertId}`} className="block underline" style={{ color: "var(--sx-accent)" }}>
                      View {a.alertId} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
