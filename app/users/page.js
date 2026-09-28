"use client";

import { useEffect, useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/apiClient";

const ROLES = ["ADMIN", "SECURITY_ANALYST", "EMPLOYEE"];
const DEPARTMENTS = ["IT", "Finance", "HR", "Security", "Engineering", "Management"];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", role: "EMPLOYEE", department: "IT" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const data = await apiFetch("/api/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiFetch("/api/users", { method: "POST", body: form });
      setForm({ name: "", email: "", username: "", password: "", role: "EMPLOYEE", department: "IT" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(id, patch) {
    setBusy(true);
    try {
      await apiFetch(`/api/users/${id}`, { method: "PATCH", body: patch });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      allowedRoles={["ADMIN"]}
      title="User Management"
      subtitle={`${users.length} users`}
      actions={
        <button className="sx-btn sx-btn-primary" onClick={() => setShowCreate((s) => !s)}>
          <UserPlus size={14} /> New User
        </button>
      }
    >
      {showCreate && (
        <form onSubmit={createUser} className="sx-card p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="sx-input" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className="sx-input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <input className="sx-input" placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
          <input className="sx-input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          <select className="sx-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="sx-input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {error && <p className="text-xs col-span-full" style={{ color: "var(--sx-critical)" }}>{error}</p>}
          <button className="sx-btn sx-btn-primary col-span-full" disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : "Create User"}
          </button>
        </form>
      )}

      <div className="sx-card overflow-x-auto">
        <table className="sx-table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td style={{ color: "var(--sx-text)" }}>{u.name}</td>
                <td>{u.username}</td>
                <td>
                  <select
                    className="sx-input py-1"
                    style={{ minWidth: 150 }}
                    defaultValue={u.role}
                    disabled={busy}
                    onChange={(e) => updateUser(u._id, { role: e.target.value })}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>{u.department}</td>
                <td style={{ color: u.status === "ACTIVE" ? "var(--sx-low)" : "var(--sx-critical)" }}>{u.status}</td>
                <td>{u.riskScore}</td>
                <td style={{ color: "var(--sx-text-dim)" }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}</td>
                <td>
                  <button
                    className="sx-btn"
                    disabled={busy}
                    onClick={() => updateUser(u._id, { status: u.status === "DISABLED" ? "ACTIVE" : "DISABLED" })}
                  >
                    {u.status === "DISABLED" ? "Enable" : "Disable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
