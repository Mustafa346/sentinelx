"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badges";
import { apiFetch } from "@/lib/apiClient";

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const STATUSES = ["NEW", "IN_REVIEW", "INVESTIGATING", "TRUE_POSITIVE", "FALSE_POSITIVE", "RESOLVED", "CLOSED"];

export default function AlertsPage() {
  return (
    <Suspense fallback={null}>
      <AlertsPageInner />
    </Suspense>
  );
}

function AlertsPageInner() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: "", status: "", detectionType: "" });

  const load = useCallback(async (p = 1, f = filters) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p });
    if (f.severity) params.set("severity", f.severity);
    if (f.status) params.set("status", f.status);
    if (f.detectionType) params.set("detectionType", f.detectionType);
    try {
      const data = await apiFetch(`/api/alerts?${params.toString()}`);
      setAlerts(data.alerts);
      setTotal(data.total);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <AppShell allowedRoles={["ADMIN", "SECURITY_ANALYST"]} title="Alerts" subtitle={`${total} total alerts`}>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="sx-input w-auto" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="sx-input w-auto" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div className="sx-card overflow-x-auto">
        <table className="sx-table w-full">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Title</th>
              <th>User</th>
              <th>Source IP</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.alertId} className="cursor-pointer" onClick={() => router.push(`/alerts/${a.alertId}`)}>
                <td><SeverityBadge severity={a.severity} /></td>
                <td style={{ color: "var(--sx-text)" }}>{a.title}</td>
                <td>{a.username || "-"}</td>
                <td className="font-mono">{a.sourceIP || "-"}</td>
                <td><StatusBadge status={a.status} /></td>
                <td>{a.riskScore}</td>
                <td style={{ color: "var(--sx-text-dim)" }}>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && alerts.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--sx-text-dim)" }}>
                  No security alerts found. Run an attack simulation to generate security events.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button className="sx-btn" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
          <span className="px-2 py-2 text-sm" style={{ color: "var(--sx-text-dim)" }}>Page {page}</span>
          <button className="sx-btn" disabled={page * 20 >= total} onClick={() => load(page + 1)}>Next</button>
        </div>
      )}
    </AppShell>
  );
}
