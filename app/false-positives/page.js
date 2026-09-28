"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";

function Stat({ label, value, tone }) {
  return (
    <div className="sx-card p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: tone || "var(--sx-text)" }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: "var(--sx-text-dim)" }}>{label}</div>
    </div>
  );
}

export default function FalsePositivesPage() {
  const [data, setData] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [form, setForm] = useState({ ruleId: "", sourceIP: "", username: "", startHour: "", endHour: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [fp, ex] = await Promise.all([
      apiFetch("/api/analytics/false-positives"),
      apiFetch("/api/exceptions"),
    ]);
    setData(fp);
    setExceptions(ex.exceptions);
  }

  useEffect(() => {
    load();
  }, []);

  async function createException(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiFetch("/api/exceptions", {
        method: "POST",
        body: {
          ruleId: form.ruleId,
          sourceIP: form.sourceIP || undefined,
          username: form.username || undefined,
          startHour: form.startHour ? Number(form.startHour) : undefined,
          endHour: form.endHour ? Number(form.endHour) : undefined,
          reason: form.reason,
        },
      });
      setForm({ ruleId: "", sourceIP: "", username: "", startHour: "", endHour: "", reason: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <AppShell allowedRoles={["ADMIN", "SECURITY_ANALYST"]} title="Loading..." />;

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title="False Positive Tuning"
      subtitle="Detection quality metrics calculated from actual triaged alerts"
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Total Alerts (before tuning)" value={data.summary.beforeTuning} />
        <Stat label="After Tuning (excl. FPs)" value={data.summary.afterTuning} tone="var(--sx-accent)" />
        <Stat label="Noise Reduction" value={`${data.summary.noiseReduction}%`} tone="var(--sx-low)" />
        <Stat label="False Positive Rate" value={`${data.summary.falsePositiveRate}%`} tone="var(--sx-high)" />
        <Stat label="Precision" value={`${data.summary.precision}%`} tone="var(--sx-low)" />
      </div>

      <div className="sx-card overflow-x-auto mb-6">
        <table className="sx-table w-full">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Total Alerts</th>
              <th>True Positive</th>
              <th>False Positive</th>
              <th>FP Rate</th>
              <th>Precision</th>
              <th>Exclusions</th>
            </tr>
          </thead>
          <tbody>
            {data.perRule.map((r) => (
              <tr key={r.ruleId}>
                <td style={{ color: "var(--sx-text)" }}>{r.name}</td>
                <td>{r.total}</td>
                <td style={{ color: "var(--sx-critical)" }}>{r.truePositive}</td>
                <td style={{ color: "var(--sx-text-dim)" }}>{r.falsePositive}</td>
                <td>{r.falsePositiveRate}%</td>
                <td>{r.precision}%</td>
                <td>{r.exclusionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sx-card p-4">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Create Exception</div>
          <form onSubmit={createException} className="space-y-2">
            <select className="sx-input" value={form.ruleId} onChange={(e) => setForm((f) => ({ ...f, ruleId: e.target.value }))} required>
              <option value="">Select detection rule...</option>
              {data.perRule.map((r) => (
                <option key={r.ruleId} value={r.ruleId}>{r.name}</option>
              ))}
            </select>
            <input className="sx-input" placeholder="Source IP (optional)" value={form.sourceIP} onChange={(e) => setForm((f) => ({ ...f, sourceIP: e.target.value }))} />
            <input className="sx-input" placeholder="Username (optional)" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            <div className="flex gap-2">
              <input className="sx-input" type="number" min={0} max={23} placeholder="Start hour" value={form.startHour} onChange={(e) => setForm((f) => ({ ...f, startHour: e.target.value }))} />
              <input className="sx-input" type="number" min={0} max={23} placeholder="End hour" value={form.endHour} onChange={(e) => setForm((f) => ({ ...f, endHour: e.target.value }))} />
            </div>
            <input className="sx-input" placeholder="Reason (e.g. Known admin activity)" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} required />
            {error && <p className="text-xs" style={{ color: "var(--sx-critical)" }}>{error}</p>}
            <button className="sx-btn sx-btn-primary w-full" disabled={busy}>Add Exception</button>
          </form>
        </div>

        <div className="sx-card p-4">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Active Exceptions</div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {exceptions.map((ex, i) => (
              <div key={i} className="text-xs p-2 rounded-lg" style={{ background: "var(--sx-panel-2)" }}>
                <div style={{ color: "var(--sx-text)" }} className="font-medium">{ex.ruleName}</div>
                <div style={{ color: "var(--sx-text-dim)" }}>
                  {ex.sourceIP && `IP: ${ex.sourceIP} `}
                  {ex.username && `User: ${ex.username} `}
                  {ex.startHour != null && `Hours: ${ex.startHour}-${ex.endHour} `}
                  — {ex.reason}
                </div>
              </div>
            ))}
            {exceptions.length === 0 && <p className="text-xs" style={{ color: "var(--sx-text-dim)" }}>No exceptions configured.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
