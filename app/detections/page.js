"use client";

import { useEffect, useState } from "react";
import { Radar, ChevronDown, ChevronUp } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";
import { SeverityBadge } from "@/components/ui/Badges";
import { useAuth } from "@/components/AuthProvider";

export default function DetectionsPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  async function load() {
    const data = await apiFetch("/api/detections");
    setRules(data.rules);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(rule) {
    if (!isAdmin) return;
    setBusy(true);
    try {
      await apiFetch(`/api/detections/${rule.ruleId}`, {
        method: "PATCH",
        body: { status: rule.status === "ENABLED" ? "DISABLED" : "ENABLED" },
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function updateField(rule, field, value) {
    if (!isAdmin) return;
    setBusy(true);
    try {
      await apiFetch(`/api/detections/${rule.ruleId}`, { method: "PATCH", body: { [field]: Number(value) } });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title="Detection Rules"
      subtitle="Configurable detection logic that drives the alerting pipeline"
    >
      <div className="space-y-3">
        {rules.map((rule) => {
          const isOpen = expanded === rule.ruleId;
          return (
            <div key={rule.ruleId} className="sx-card p-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isOpen ? null : rule.ruleId)}>
                <div className="flex items-center gap-3">
                  <Radar size={16} color="var(--sx-accent)" />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--sx-text)" }}>{rule.name}</div>
                    <div className="text-xs" style={{ color: "var(--sx-text-dim)" }}>{rule.ruleId} · {rule.mitreTechniqueId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={rule.severity} />
                  <span
                    className="sx-badge"
                    style={{
                      color: rule.status === "ENABLED" ? "var(--sx-low)" : "var(--sx-text-dim)",
                      background: rule.status === "ENABLED" ? "rgba(74,222,128,0.1)" : "rgba(142,160,181,0.1)",
                    }}
                  >
                    {rule.status}
                  </span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--sx-border)" }}>
                  <p className="text-sm" style={{ color: "var(--sx-text-dim)" }}>{rule.logicDescription}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {rule.threshold != null && (
                      <div>
                        <div className="text-[10px] uppercase" style={{ color: "var(--sx-text-dim)" }}>Threshold</div>
                        <input
                          type="number"
                          className="sx-input"
                          defaultValue={rule.threshold}
                          disabled={!isAdmin || busy}
                          onBlur={(e) => e.target.value != rule.threshold && updateField(rule, "threshold", e.target.value)}
                        />
                      </div>
                    )}
                    {rule.distinctUserThreshold != null && (
                      <div>
                        <div className="text-[10px] uppercase" style={{ color: "var(--sx-text-dim)" }}>Distinct Users</div>
                        <input
                          type="number"
                          className="sx-input"
                          defaultValue={rule.distinctUserThreshold}
                          disabled={!isAdmin || busy}
                          onBlur={(e) => e.target.value != rule.distinctUserThreshold && updateField(rule, "distinctUserThreshold", e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "var(--sx-text-dim)" }}>Time Window (min)</div>
                      <input
                        type="number"
                        className="sx-input"
                        defaultValue={rule.timeWindowMinutes}
                        disabled={!isAdmin || busy}
                        onBlur={(e) => e.target.value != rule.timeWindowMinutes && updateField(rule, "timeWindowMinutes", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase" style={{ color: "var(--sx-text-dim)" }}>Tactic</div>
                      <div style={{ color: "var(--sx-text)" }} className="pt-1.5">{rule.mitreTactic}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase mb-1" style={{ color: "var(--sx-text-dim)" }}>
                      Exclusions ({rule.exclusions.length})
                    </div>
                    {rule.exclusions.length === 0 ? (
                      <p className="text-xs" style={{ color: "var(--sx-text-dim)" }}>No exclusions configured.</p>
                    ) : (
                      <div className="space-y-1">
                        {rule.exclusions.map((ex, i) => (
                          <div key={i} className="text-xs px-2 py-1 rounded" style={{ background: "var(--sx-panel-2)", color: "var(--sx-text-dim)" }}>
                            {ex.sourceIP && `IP: ${ex.sourceIP} `}
                            {ex.username && `User: ${ex.username} `}
                            {ex.startHour != null && `Hours: ${ex.startHour}:00-${ex.endHour}:00 `}
                            — {ex.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <button className="sx-btn" disabled={busy} onClick={() => toggleStatus(rule)}>
                      {rule.status === "ENABLED" ? "Disable Rule" : "Enable Rule"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
