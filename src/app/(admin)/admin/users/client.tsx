"use client";

import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  _count: { reports: number };
}

type ModalMode = "add" | "edit";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) return res.json() as Promise<User[]>;
    return [] as User[];
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchUsers().then((data) => {
      if (!cancelled) setUsers(data);
    });
    return () => { cancelled = true; };
  }, [fetchUsers]);

  const loading = users === null;

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditingUser(null);
    setModalMode("add");
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setModalMode("edit");
  }

  async function handleDelete(user: User) {
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev?.filter((u) => u.id !== user.id) ?? null);
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to delete user");
    }
    setDeleteTarget(null);
  }

  function handleSaved(updated: User, isNew: boolean) {
    setUsers((prev) =>
      isNew
        ? [updated, ...(prev ?? [])]
        : (prev ?? []).map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
    );
    setModalMode(null);
  }

  const adminCount = (users ?? []).filter((u) => u.role === "ADMIN").length;
  const memberCount = (users ?? []).filter((u) => u.role === "MEMBER").length;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage team members and admin accounts.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add user
        </button>
      </div>

      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total users", value: (users ?? []).length },
            { label: "Members", value: memberCount },
            { label: "Admins", value: adminCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {search && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reports</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                        user.role === "ADMIN" ? "bg-violet-100 text-violet-700" : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                        : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.role === "ADMIN" ? "bg-violet-500" : "bg-blue-500"}`} />
                      {user.role === "ADMIN" ? "Admin" : "Member"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{user._count.reports}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => setDeleteTarget(user)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalMode && (
        <UserFormModal
          mode={modalMode}
          user={editingUser}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  user: User | null;
  onClose: () => void;
  onSaved: (user: User, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<UserFormData>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "MEMBER",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof UserFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (mode === "add" && !form.password) {
      setError("Password is required");
      return;
    }

    setSaving(true);
    try {
      const url = mode === "edit" && user ? `/api/admin/users/${user.id}` : "/api/admin/users";
      const method = mode === "edit" ? "PUT" : "POST";
      const body: Partial<UserFormData> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save user");
        return;
      }

      onSaved({ ...data, _count: { reports: user?._count?.reports ?? 0 } }, mode === "add");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {mode === "add" ? "Add new user" : `Edit ${user?.name}`}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className={labelCls}>Full name</label>
            <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Jane Smith" />
          </div>
          <div>
            <label className={labelCls}>Email address</label>
            <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="jane@example.com" />
          </div>
          <div>
            <label className={labelCls}>
              Password {mode === "edit" && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
            </label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} placeholder={mode === "edit" ? "••••••••" : "Min. 6 characters"} />
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <div className="flex gap-3">
              {(["MEMBER", "ADMIN"] as const).map((r) => (
                <label key={r} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                  form.role === r
                    ? r === "ADMIN"
                      ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                      : "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                }`}>
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => set("role", r)} className="sr-only" />
                  {r === "ADMIN" ? "Admin" : "Member"}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {saving ? "Saving..." : mode === "add" ? "Add user" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onCancel, onConfirm }: { user: User; onCancel: () => void; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  async function handleConfirm() { setConfirming(true); await onConfirm(); setConfirming(false); }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Delete user</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
          Are you sure you want to delete <span className="font-semibold">{user.name}</span>?
          Their account and all <span className="font-semibold">{user._count.reports} report{user._count.reports !== 1 ? "s" : ""}</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={confirming} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
            {confirming ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
