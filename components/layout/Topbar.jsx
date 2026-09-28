"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const ROLE_LABEL = {
  ADMIN: "Administrator",
  SECURITY_ANALYST: "Security Analyst",
  EMPLOYEE: "Employee",
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!user || user.role === "EMPLOYEE") return;
    let cancelled = false;
    async function poll() {
      try {
        const data = await apiFetch("/api/notifications");
        if (!cancelled) {
          setNotifications(data.notifications);
          setUnread(data.notifications.filter((n) => !n.isRead).length);
        }
      } catch {
        /* ignore */
      }
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    function onClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function runSearch(q) {
    setQuery(q);
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }
    try {
      const data = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data.results);
    } catch {
      setResults(null);
    }
  }

  async function markRead(id) {
    try {
      await apiFetch(`/api/notifications`, { method: "PATCH", body: { id } });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  }

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3"
      style={{ background: "var(--sx-bg)", borderBottom: "1px solid var(--sx-border)" }}
    >
      {user && user.role !== "EMPLOYEE" && (
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "var(--sx-text-dim)" }} />
          <input
            className="sx-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search users, alerts, IPs, events, rules..."
            value={query}
            onChange={(e) => runSearch(e.target.value)}
          />
          {results && (
            <div className="sx-card absolute mt-1 w-full max-h-80 overflow-y-auto p-2 z-30">
              {Object.entries(results).every(([, v]) => v.length === 0) && (
                <div className="text-sm px-2 py-2" style={{ color: "var(--sx-text-dim)" }}>
                  No results.
                </div>
              )}
              {Object.entries(results).map(([category, items]) =>
                items.length ? (
                  <div key={category} className="mb-2">
                    <div className="text-[10px] uppercase tracking-wide px-2 mb-1" style={{ color: "var(--sx-text-dim)" }}>
                      {category}
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="px-2 py-1.5 text-sm rounded hover:bg-white/5 cursor-pointer"
                        onClick={() => {
                          if (item.href) router.push(item.href);
                          setResults(null);
                          setQuery("");
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {user && user.role !== "EMPLOYEE" && (
        <div className="relative">
          <button className="sx-btn relative" onClick={() => setNotifOpen((o) => !o)}>
            <Bell size={16} />
            {unread > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-[10px] font-bold rounded-full w-4 h-4"
                style={{ background: "var(--sx-critical)", color: "white" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="sx-card absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto p-2 z-30">
              <div className="text-xs font-semibold px-2 py-1" style={{ color: "var(--sx-text-dim)" }}>
                Notifications
              </div>
              {notifications.length === 0 && (
                <div className="text-sm px-2 py-3" style={{ color: "var(--sx-text-dim)" }}>
                  No notifications yet.
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className="px-2 py-2 rounded cursor-pointer text-sm"
                  style={{ background: n.isRead ? "transparent" : "rgba(34,211,238,0.06)" }}
                  onClick={() => markRead(n._id)}
                >
                  <div className="font-medium" style={{ color: "var(--sx-text)" }}>
                    {n.title}
                  </div>
                  <div style={{ color: "var(--sx-text-dim)" }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <button
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--sx-accent)", color: "#051014" }}
          >
            {user?.name?.[0] || "?"}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold" style={{ color: "var(--sx-text)" }}>
              {user?.name}
            </div>
            <div className="text-[10px]" style={{ color: "var(--sx-text-dim)" }}>
              {ROLE_LABEL[user?.role] || user?.role}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: "var(--sx-text-dim)" }} />
        </button>
        {menuOpen && (
          <div className="sx-card absolute right-0 mt-1 w-44 p-1 z-30">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-white/5"
              style={{ color: "var(--sx-text)" }}
              onClick={logout}
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
