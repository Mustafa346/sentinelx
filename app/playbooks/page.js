"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState([]);

  useEffect(() => {
    apiFetch("/api/playbooks").then((d) => setPlaybooks(d.playbooks));
  }, []);

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title="Incident Response Playbooks"
      subtitle="Step-by-step response guidance for each detection type"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playbooks.map((pb) => (
          <div key={pb.detectionType} className="sx-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} color="var(--sx-accent)" />
              <div className="text-sm font-semibold" style={{ color: "var(--sx-text)" }}>{pb.title}</div>
            </div>
            <ol className="space-y-1.5">
              {pb.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="font-mono shrink-0" style={{ color: "var(--sx-accent)" }}>{i + 1}.</span>
                  <span style={{ color: "var(--sx-text-dim)" }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
