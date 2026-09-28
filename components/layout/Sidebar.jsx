"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Bell,
  Activity,
  Search,
  Radar,
  Target,
  ListChecks,
  Users,
  BookOpen,
  FileText,
  ScrollText,
  Settings,
  Crosshair,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const NAV_SECTIONS = [
  {
    label: "Security Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SECURITY_ANALYST", "EMPLOYEE"] },
      { href: "/alerts", label: "Alerts", icon: ShieldAlert, roles: ["ADMIN", "SECURITY_ANALYST"] },
      { href: "/events", label: "Events", icon: Activity, roles: ["ADMIN", "SECURITY_ANALYST", "EMPLOYEE"] },
    ],
  },
  {
    label: "Detection Engineering",
    items: [
      { href: "/detections", label: "Detection Rules", icon: Radar, roles: ["ADMIN", "SECURITY_ANALYST"] },
      { href: "/mitre", label: "MITRE ATT&CK", icon: Crosshair, roles: ["ADMIN", "SECURITY_ANALYST"] },
      { href: "/false-positives", label: "False Positive Tuning", icon: ListChecks, roles: ["ADMIN", "SECURITY_ANALYST"] },
    ],
  },
  {
    label: "Simulation",
    items: [{ href: "/simulator", label: "Attack Simulator", icon: Target, roles: ["ADMIN", "SECURITY_ANALYST"] }],
  },
  {
    label: "Identity",
    items: [{ href: "/users", label: "Users", icon: Users, roles: ["ADMIN"] }],
  },
  {
    label: "Response",
    items: [
      { href: "/playbooks", label: "Playbooks", icon: BookOpen, roles: ["ADMIN", "SECURITY_ANALYST"] },
      { href: "/reports", label: "Reports", icon: FileText, roles: ["ADMIN", "SECURITY_ANALYST"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["ADMIN"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "EMPLOYEE";

  return (
    <aside
      className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{ background: "var(--sx-panel)", borderRight: "1px solid var(--sx-border)" }}
    >
      <div className="flex items-center gap-2 px-5 py-5" style={{ borderBottom: "1px solid var(--sx-border)" }}>
        <ShieldAlert size={22} color="var(--sx-accent)" />
        <div>
          <div className="font-bold text-sm tracking-wide" style={{ color: "var(--sx-text)" }}>
            SentinelX
          </div>
          <div className="text-[10px]" style={{ color: "var(--sx-text-dim)" }}>
            Identity Threat Detection
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((i) => i.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              <div
                className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--sx-text-dim)" }}
              >
                {section.label}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        color: active ? "var(--sx-accent)" : "var(--sx-text-dim)",
                        background: active ? "rgba(34,211,238,0.08)" : "transparent",
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
