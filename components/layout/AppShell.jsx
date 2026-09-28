"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children, allowedRoles = null, title, subtitle, actions }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen" style={{ background: "var(--sx-bg)" }}>
        <p style={{ color: "var(--sx-text-dim)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--sx-bg)" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6 max-w-[1400px] w-full mx-auto">
          {(title || actions) && (
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                {title && (
                  <h1 className="text-xl font-bold" style={{ color: "var(--sx-text)" }}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm mt-0.5" style={{ color: "var(--sx-text-dim)" }}>
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
