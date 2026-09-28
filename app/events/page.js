"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";

const EVENT_TYPES = [
  "LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGOUT", "MFA_RESET", "MFA_REGISTERED",
  "PASSWORD_CHANGED", "ROLE_CHANGED", "PRIVILEGE_ESCALATED", "NEW_DEVICE",
  "NEW_IP", "NEW_LOCATION", "ADMIN_LOGIN", "OFF_HOURS_LOGIN", "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
];

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ eventType: "", result: "", sourceIP: "" });

  const load = useCallback(async (p = 1, f = filters) => {
    const params = new URLSearchParams({ page: p });
    if (f.eventType) params.set("eventType", f.eventType);
    if (f.result) params.set("result", f.result);
    if (f.sourceIP) params.set("sourceIP", f.sourceIP);
    const data = await apiFetch(`/api/events?${params.toString()}`);
    setEvents(data.events);
    setTotal(data.total);
    setPage(data.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const isEmployee = user?.role === "EMPLOYEE";

  return (
    <AppShell
      title={isEmployee ? "My Login History" : "Identity Events"}
      subtitle={`${total} events`}
    >
      {!isEmployee && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select className="sx-input w-auto" value={filters.eventType} onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}>
            <option value="">All event types</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <select className="sx-input w-auto" value={filters.result} onChange={(e) => setFilters((f) => ({ ...f, result: e.target.value }))}>
            <option value="">All results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="INFO">Info</option>
          </select>
          <input
            className="sx-input w-auto"
            placeholder="Filter by IP"
            value={filters.sourceIP}
            onChange={(e) => setFilters((f) => ({ ...f, sourceIP: e.target.value }))}
          />
        </div>
      )}

      <div className="sx-card overflow-x-auto">
        <table className="sx-table w-full">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Event</th>
              <th>Result</th>
              <th>IP</th>
              <th>Device</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e._id}>
                <td style={{ color: "var(--sx-text-dim)" }}>{new Date(e.timestamp).toLocaleString()}</td>
                <td style={{ color: "var(--sx-text)" }}>{e.username || "-"}</td>
                <td>{e.eventType.replace(/_/g, " ")}</td>
                <td style={{ color: e.result === "FAILED" ? "var(--sx-critical)" : e.result === "SUCCESS" ? "var(--sx-low)" : "var(--sx-text-dim)" }}>
                  {e.result}
                </td>
                <td className="font-mono">{e.sourceIP}</td>
                <td>{e.device} / {e.browser}</td>
                <td>{e.city}, {e.country}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--sx-text-dim)" }}>No events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="flex justify-center gap-2 mt-4">
          <button className="sx-btn" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
          <span className="px-2 py-2 text-sm" style={{ color: "var(--sx-text-dim)" }}>Page {page}</span>
          <button className="sx-btn" disabled={page * 25 >= total} onClick={() => load(page + 1)}>Next</button>
        </div>
      )}
    </AppShell>
  );
}
