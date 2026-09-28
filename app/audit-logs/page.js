"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  async function load(p = 1) {
    const data = await apiFetch(`/api/audit-logs?page=${p}`);
    setLogs(data.logs);
    setTotal(data.total);
    setPage(data.page);
  }

  useEffect(() => {
    load(1);
  }, []);

  return (
    <AppShell allowedRoles={["ADMIN"]} title="Audit Logs" subtitle={`${total} recorded actions`}>
      <div className="sx-card overflow-x-auto">
        <table className="sx-table w-full">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td style={{ color: "var(--sx-text-dim)" }}>{new Date(l.timestamp).toLocaleString()}</td>
                <td style={{ color: "var(--sx-text)" }}>{l.actorUsername}</td>
                <td>{l.action.replace(/_/g, " ")}</td>
                <td>{l.target || "-"}</td>
                <td style={{ color: "var(--sx-text-dim)" }}>{l.description}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: "var(--sx-text-dim)" }}>No audit logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 30 && (
        <div className="flex justify-center gap-2 mt-4">
          <button className="sx-btn" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
          <span className="px-2 py-2 text-sm" style={{ color: "var(--sx-text-dim)" }}>Page {page}</span>
          <button className="sx-btn" disabled={page * 30 >= total} onClick={() => load(page + 1)}>Next</button>
        </div>
      )}
    </AppShell>
  );
}
