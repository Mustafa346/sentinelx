"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, ShieldAlert, Flame, CheckCircle2, XCircle, Users as UsersIcon, Radar } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badges";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";

const SEVERITY_COLORS = {
  CRITICAL: "#f43f5e",
  HIGH: "#fb923c",
  MEDIUM: "#facc15",
  LOW: "#4ade80",
  INFO: "#60a5fa",
};

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="sx-card p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${tone}22`, color: tone }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-lg font-bold" style={{ color: "var(--sx-text)" }}>
          {value}
        </div>
        <div className="text-[11px]" style={{ color: "var(--sx-text-dim)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    apiFetch("/api/events?pageSize=10")
      .then((d) => setEvents(d.events))
      .catch(() => {});
  }, []);

  return (
    <AppShell title="My Activity" subtitle="Your recent authentication activity">
      <div className="sx-card p-4">
        <table className="sx-table w-full">
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Result</th>
              <th>IP</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e._id}>
                <td style={{ color: "var(--sx-text-dim)" }}>{new Date(e.timestamp).toLocaleString()}</td>
                <td style={{ color: "var(--sx-text)" }}>{e.eventType.replace(/_/g, " ")}</td>
                <td>{e.result}</td>
                <td className="font-mono">{e.sourceIP}</td>
                <td>{e.device}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6" style={{ color: "var(--sx-text-dim)" }}>
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role === "EMPLOYEE") return;
    apiFetch("/api/analytics/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, [user]);

  if (user?.role === "EMPLOYEE") return <EmployeeDashboard />;

  return (
    <AppShell
      allowedRoles={["ADMIN", "SECURITY_ANALYST"]}
      title="SOC Dashboard"
      subtitle="Real-time identity threat detection overview"
    >
      {error && <div className="sx-card p-4 mb-4" style={{ color: "var(--sx-critical)" }}>{error}</div>}
      {!data ? (
        <div style={{ color: "var(--sx-text-dim)" }}>Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Events" value={data.stats.totalEvents} icon={Activity} tone="#60a5fa" />
            <StatCard label="Total Alerts" value={data.stats.totalAlerts} icon={ShieldAlert} tone="#22d3ee" />
            <StatCard label="Critical Alerts" value={data.stats.criticalAlerts} icon={Flame} tone="#f43f5e" />
            <StatCard label="High Alerts" value={data.stats.highAlerts} icon={Flame} tone="#fb923c" />
            <StatCard label="Open Incidents" value={data.stats.openIncidents} icon={ShieldAlert} tone="#facc15" />
            <StatCard label="False Positives" value={data.stats.falsePositives} icon={XCircle} tone="#8ea0b5" />
            <StatCard label="Detection Rules" value={data.stats.detectionRules} icon={Radar} tone="#4ade80" />
            <StatCard label="Active Users" value={data.stats.activeUsers} icon={UsersIcon} tone="#38bdf8" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="sx-card p-4 lg:col-span-2">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>
                Events &amp; Alerts Over Time (14 days)
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mergeTimeSeries(data.eventsOverTime, data.alertsOverTime)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sx-border)" />
                  <XAxis dataKey="date" stroke="var(--sx-text-dim)" fontSize={11} />
                  <YAxis stroke="var(--sx-text-dim)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--sx-panel-2)", border: "1px solid var(--sx-border)" }} />
                  <Area type="monotone" dataKey="events" stroke="#38bdf8" fill="#38bdf822" name="Events" />
                  <Area type="monotone" dataKey="alerts" stroke="#f43f5e" fill="#f43f5e22" name="Alerts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="sx-card p-4">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>
                Alerts by Severity
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.alertsBySeverity}
                    dataKey="count"
                    nameKey="severity"
                    innerRadius={45}
                    outerRadius={75}
                  >
                    {data.alertsBySeverity.map((s) => (
                      <Cell key={s.severity} fill={SEVERITY_COLORS[s.severity] || "#8ea0b5"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--sx-panel-2)", border: "1px solid var(--sx-border)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="sx-card p-4">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>
                Alerts by Detection Type
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.alertsByType} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="var(--sx-text-dim)" fontSize={11} />
                  <YAxis dataKey="type" type="category" stroke="var(--sx-text-dim)" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ background: "var(--sx-panel-2)", border: "1px solid var(--sx-border)" }} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="sx-card p-4">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>
                Top Attacked Users
              </div>
              <div className="space-y-2">
                {data.topUsers.map((u) => (
                  <div key={u.username} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--sx-text)" }}>{u.username}</span>
                    <span style={{ color: "var(--sx-text-dim)" }}>{u.count} alerts</span>
                  </div>
                ))}
                {data.topUsers.length === 0 && <p style={{ color: "var(--sx-text-dim)" }} className="text-sm">No data yet.</p>}
              </div>
            </div>

            <div className="sx-card p-4">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--sx-text)" }}>
                Top Source IPs
              </div>
              <div className="space-y-2">
                {data.topIPs.map((i) => (
                  <div key={i.ip} className="flex items-center justify-between text-sm">
                    <span className="font-mono" style={{ color: "var(--sx-text)" }}>
                      {i.ip}
                    </span>
                    <span style={{ color: "var(--sx-text-dim)" }}>{i.count} alerts</span>
                  </div>
                ))}
                {data.topIPs.length === 0 && <p style={{ color: "var(--sx-text-dim)" }} className="text-sm">No data yet.</p>}
              </div>
            </div>
          </div>

          <div className="sx-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ color: "var(--sx-text)" }}>
                Live / Recent Alert Feed
              </div>
              <Link href="/alerts" className="text-xs" style={{ color: "var(--sx-accent)" }}>
                View all alerts
              </Link>
            </div>
            <div className="space-y-1">
              {data.recentAlerts.map((a) => (
                <Link
                  key={a.alertId}
                  href={`/alerts/${a.alertId}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={a.severity} />
                    <span className="text-sm" style={{ color: "var(--sx-text)" }}>
                      {a.title}
                    </span>
                    {a.username && (
                      <span className="text-xs" style={{ color: "var(--sx-text-dim)" }}>
                        {a.username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <span className="text-xs" style={{ color: "var(--sx-text-dim)" }}>
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
              {data.recentAlerts.length === 0 && (
                <div className="text-sm py-6 text-center" style={{ color: "var(--sx-text-dim)" }}>
                  No security alerts found. Run an attack simulation to generate security events.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function mergeTimeSeries(events, alerts) {
  const map = new Map();
  events.forEach((e) => map.set(e.date, { date: e.date, events: e.count, alerts: 0 }));
  alerts.forEach((a) => {
    const existing = map.get(a.date) || { date: a.date, events: 0, alerts: 0 };
    existing.alerts = a.count;
    map.set(a.date, existing);
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
