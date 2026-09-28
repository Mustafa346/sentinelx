"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badges";
import { apiFetch } from "@/lib/apiClient";

const FALSE_POSITIVE_REASONS = [
  "Known admin activity",
  "Scheduled maintenance",
  "Helpdesk activity",
  "Trusted IP",
  "Authorized device",
  "Expected behavior",
];

export default function AlertDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [fpReason, setFpReason] = useState(FALSE_POSITIVE_REASONS[0]);
  const [showFpForm, setShowFpForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/alerts/${id}`);
      setAlert(data.alert);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateAlert(payload) {
    setBusy(true);
    try {
      await apiFetch(`/api/alerts/${id}`, { method: "PATCH", body: payload });
      await load();
      setNote("");
      setShowFpForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateReport() {
    setBusy(true);
    try {
      const data = await apiFetch("/api/reports", { method: "POST", body: { alertId: id } });
      setReportGenerated(data.report.reportId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !alert) {
    return (
      <AppShell allowedRoles={["ADMIN", "SECURITY_ANALYST"]} title="Alert not found">
        <p style={{ color: "var(--sx-critical)" }}>{error}</p>
      </AppShell>
    );
  }

  if (!alert) {
    return (
      <AppShell allowedRoles={["ADMIN", "SECURITY_ANALYST"]} title="Loading...">
        <Loader2 className="animate-spin" />
      </AppShell>
    );
  }

  const timeline = [...alert.evidence].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title={
        <button className="flex items-center gap-2" onClick={() => router.push("/alerts")}>
          <ArrowLeft size={16} /> {alert.title}
        </button>
      }
      subtitle={alert.alertId}
      actions={
        <button className="sx-btn sx-btn-primary" onClick={generateReport} disabled={busy}>
          <FileText size={14} /> Generate Report
        </button>
      }
    >
      {reportGenerated && (
        <div className="sx-card p-3 mb-4" style={{ color: "var(--sx-low)" }}>
          Report {reportGenerated} generated.{" "}
          <a href="/reports" className="underline" style={{ color: "var(--sx-accent)" }}>
            View in Reports →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Overview</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Severity"><SeverityBadge severity={alert.severity} /></Field>
              <Field label="Status"><StatusBadge status={alert.status} /></Field>
              <Field label="Risk Score">{alert.riskScore} / 100</Field>
              <Field label="Detection Rule">{alert.detectionRule?.name}</Field>
              <Field label="Timestamp">{new Date(alert.timestamp).toLocaleString()}</Field>
              <Field label="Assigned Analyst">{alert.assignedAnalyst?.name || "Unassigned"}</Field>
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--sx-text-dim)" }}>{alert.description}</p>
          </div>

          {/* Entity info */}
          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Entity Information</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="User">{alert.username || "-"}</Field>
              <Field label="Source IP" mono>{alert.sourceIP || "-"}</Field>
            </div>
          </div>

          {/* Timeline / Evidence */}
          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Timeline &amp; Evidence</div>
            <div className="space-y-2">
              {timeline.map((ev) => (
                <div key={ev._id} className="flex gap-3 text-sm">
                  <span className="w-20 shrink-0" style={{ color: "var(--sx-text-dim)" }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{ color: "var(--sx-text)" }}>
                    {ev.eventType.replace(/_/g, " ")}
                    {ev.result === "FAILED" ? " (failed)" : ""}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "var(--sx-text-dim)" }}>{ev.sourceIP}</span>
                </div>
              ))}
              {timeline.length === 0 && <p style={{ color: "var(--sx-text-dim)" }} className="text-sm">No evidence attached.</p>}
            </div>
          </div>

          {/* Risk factors */}
          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Risk Score Breakdown</div>
            <div className="space-y-1">
              {alert.riskFactors.map((f, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: "var(--sx-text-dim)" }}>{f.factor}</span>
                  <span style={{ color: "var(--sx-text)" }}>+{f.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MITRE */}
          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>MITRE ATT&amp;CK</div>
            <div className="text-sm">
              <div style={{ color: "var(--sx-accent)" }} className="font-mono font-semibold">{alert.mitreTechniqueId}</div>
              <div style={{ color: "var(--sx-text)" }}>{alert.mitreTechniqueName}</div>
            </div>
          </div>
        </div>

        {/* Sidebar: actions + notes */}
        <div className="space-y-4">
          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Actions</div>
            <div className="space-y-2">
              <button className="sx-btn w-full" disabled={busy} onClick={() => updateAlert({ assignToSelf: true })}>
                Assign to me
              </button>
              <button className="sx-btn w-full" disabled={busy} onClick={() => updateAlert({ status: "INVESTIGATING" })}>
                Mark Investigating
              </button>
              <button
                className="sx-btn w-full"
                disabled={busy}
                style={{ borderColor: "var(--sx-critical)", color: "var(--sx-critical)" }}
                onClick={() => updateAlert({ status: "TRUE_POSITIVE" })}
              >
                Mark True Positive
              </button>
              <button className="sx-btn w-full" disabled={busy} onClick={() => setShowFpForm((s) => !s)}>
                Mark False Positive
              </button>
              {showFpForm && (
                <div className="space-y-2 p-2 rounded-lg" style={{ background: "var(--sx-panel-2)" }}>
                  <select className="sx-input" value={fpReason} onChange={(e) => setFpReason(e.target.value)}>
                    {FALSE_POSITIVE_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    className="sx-btn sx-btn-primary w-full"
                    disabled={busy}
                    onClick={() => updateAlert({ status: "FALSE_POSITIVE", falsePositiveReason: fpReason })}
                  >
                    Confirm
                  </button>
                </div>
              )}
              <button className="sx-btn w-full" disabled={busy} onClick={() => updateAlert({ status: "RESOLVED" })}>
                Resolve
              </button>
              <button className="sx-btn w-full" disabled={busy} onClick={() => updateAlert({ status: "CLOSED" })}>
                Close
              </button>
            </div>
          </div>

          <div className="sx-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>Investigation Notes</div>
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {alert.investigationNotes.map((n, i) => (
                <div key={i} className="text-xs p-2 rounded-lg" style={{ background: "var(--sx-panel-2)" }}>
                  <div style={{ color: "var(--sx-text)" }}>{n.note}</div>
                  <div style={{ color: "var(--sx-text-dim)" }} className="mt-1">
                    {n.author?.name || "Unknown"} · {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {alert.investigationNotes.length === 0 && (
                <p className="text-xs" style={{ color: "var(--sx-text-dim)" }}>No notes yet.</p>
              )}
            </div>
            <textarea
              className="sx-input mb-2"
              rows={3}
              placeholder="Add investigation note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="sx-btn w-full" disabled={busy || !note} onClick={() => updateAlert({ note })}>
              Add Note
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children, mono }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--sx-text-dim)" }}>{label}</div>
      <div className={mono ? "font-mono" : ""} style={{ color: "var(--sx-text)" }}>{children}</div>
    </div>
  );
}
