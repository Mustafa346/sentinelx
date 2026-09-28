"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center" style={{ background: "var(--sx-bg)" }}>
      <p style={{ color: "var(--sx-text-dim)" }}>Loading SentinelX...</p>
    </div>
  );
}
