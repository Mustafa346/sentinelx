"use client";

import { useEffect, useState } from "react";
import { Crosshair } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";
import { SeverityBadge } from "@/components/ui/Badges";

export default function MitrePage() {
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    apiFetch("/api/mitre").then((d) => setMappings(d.mappings));
  }, []);

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title="MITRE ATT&CK Mapping"
      subtitle="Detection rules mapped to real MITRE ATT&CK techniques"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mappings.map((m) => (
          <div key={m.detectionType} className="sx-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crosshair size={16} color="var(--sx-accent)" />
                <span className="font-mono font-semibold text-sm" style={{ color: "var(--sx-accent)" }}>
                  {m.techniqueId}
                </span>
              </div>
              <SeverityBadge severity={m.severity} />
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--sx-text)" }}>{m.techniqueName}</div>
            <div className="text-xs mb-3" style={{ color: "var(--sx-text-dim)" }}>Tactic: {m.tactic}</div>
            <div className="text-xs mb-2" style={{ color: "var(--sx-text-dim)" }}>Detection: {m.ruleName}</div>
            <div className="flex items-center justify-between text-sm pt-2" style={{ borderTop: "1px solid var(--sx-border)" }}>
              <span style={{ color: "var(--sx-text-dim)" }}>Alerts</span>
              <span style={{ color: "var(--sx-text)" }} className="font-semibold">{m.alertCount}</span>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
