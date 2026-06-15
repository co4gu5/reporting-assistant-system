"use client";

import { useCallback, useEffect, useState } from "react";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { reports: number };
}

interface NotificationSetting {
  alarmTime: string;
  timezone: string;
  enabled: boolean;
  notificationEmail: string; // displayed value; empty string = use account email
}

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "America/Honolulu", label: "Hawaii" },
  { value: "America/Sao_Paulo", label: "Brasilia" },
  { value: "America/Buenos_Aires", label: "Buenos Aires" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris / Berlin / Rome" },
  { value: "Europe/Helsinki", label: "Helsinki / Kyiv" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Karachi", label: "Karachi" },
  { value: "Asia/Dhaka", label: "Dhaka" },
  { value: "Asia/Bangkok", label: "Bangkok / Jakarta" },
  { value: "Asia/Shanghai", label: "Beijing / Shanghai" },
  { value: "Asia/Tokyo", label: "Tokyo / Seoul" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Name form
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification settings
  const [notif, setNotif] = useState<NotificationSetting>({
    alarmTime: "09:00",
    timezone: "UTC",
    enabled: false,
    notificationEmail: "",
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/member/profile");
    if (res.ok) return res.json() as Promise<ProfileUser>;
    return null;
  }, []);

  const fetchNotification = useCallback(async () => {
    const res = await fetch("/api/member/notification");
    if (res.ok) {
      const data = await res.json();
      if (data.setting) {
        setNotif({
          alarmTime: data.setting.alarmTime,
          timezone: data.setting.timezone,
          enabled: data.setting.enabled,
          notificationEmail: data.setting.notificationEmail ?? "",
        });
      } else {
        // Detect user's local timezone as default
        const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const matched = TIMEZONES.find((t) => t.value === local);
        setNotif((prev) => ({ ...prev, timezone: matched ? local : "UTC" }));
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProfile(), fetchNotification()]).then(([profileData]) => {
      if (!cancelled && profileData) {
        setUser(profileData);
        setName(profileData.name);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [fetchProfile, fetchNotification]);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    setNameSaving(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, name: data.name } : prev);
        setNameMsg({ type: "success", text: "Name updated successfully" });
      } else {
        setNameMsg({ type: "error", text: data.error ?? "Failed to update name" });
      }
    } catch {
      setNameMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setPwMsg({ type: "success", text: "Password updated successfully" });
      } else {
        setPwMsg({ type: "error", text: data.error ?? "Failed to update password" });
      }
    } catch {
      setPwMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleNotifSave(e: React.FormEvent) {
    e.preventDefault();
    setNotifMsg(null);
    setNotifSaving(true);
    try {
      const res = await fetch("/api/member/notification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notif,
          notificationEmail: notif.notificationEmail.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotif({
          alarmTime: data.setting.alarmTime,
          timezone: data.setting.timezone,
          enabled: data.setting.enabled,
          notificationEmail: data.setting.notificationEmail ?? "",
        });
        setNotifMsg({ type: "success", text: "Notification settings saved" });
      } else {
        setNotifMsg({ type: "error", text: data.error ?? "Failed to save" });
      }
    } catch {
      setNotifMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setNotifSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account information and notification preferences.</p>
      </div>

      {/* Account overview */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-2xl">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                {user?.role === "ADMIN" ? "Admin" : "Member"}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {user?._count.reports} report{user?._count.reports !== 1 ? "s" : ""} submitted
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Joined {new Date(user!.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Daily report reminder</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Receive an email reminder to submit your daily report at a specific time.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notif.enabled}
            onClick={() => setNotif((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              notif.enabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notif.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <form onSubmit={handleNotifSave} className="space-y-4">
          {notifMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 ${
              notifMsg.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
            }`}>{notifMsg.text}</div>
          )}
          <div className={`space-y-4 transition-opacity ${notif.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alarm time</label>
                <input type="time" value={notif.alarmTime} onChange={(e) => setNotif((prev) => ({ ...prev, alarmTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Timezone</label>
                <select value={notif.timezone} onChange={(e) => setNotif((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Send reminder to</label>
              <input type="email" value={notif.notificationEmail} onChange={(e) => setNotif((prev) => ({ ...prev, notificationEmail: e.target.value }))}
                placeholder={user?.email ?? "your account email"}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Leave empty to use your account email{user?.email ? ` (${user.email})` : ""}.
              </p>
            </div>
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                A reminder will be sent to <strong>{notif.notificationEmail.trim() || user?.email || "your account email"}</strong>{" "}
                at <strong>{notif.alarmTime}</strong>{" "}
                (<strong>{TIMEZONES.find((t) => t.value === notif.timezone)?.label ?? notif.timezone}</strong>)
                if you haven&apos;t submitted your daily report yet.
              </p>
            </div>
          </div>
          <button type="submit" disabled={notifSaving} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {notifSaving ? "Saving..." : "Save notification settings"}
          </button>
        </form>
      </div>

      {/* Update name */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Display name</h2>
        <form onSubmit={handleNameSave} className="space-y-4">
          {nameMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 ${
              nameMsg.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
            }`}>{nameMsg.text}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
            <input type="email" value={user?.email} disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email address cannot be changed.</p>
          </div>
          <button type="submit" disabled={nameSaving || name.trim() === user?.name}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {nameSaving ? "Saving..." : "Save name"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Change password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 ${
              pwMsg.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
            }`}>{pwMsg.text}</div>
          )}
          {[
            { label: "Current password", value: currentPw, onChange: setCurrentPw, placeholder: "••••••••" },
            { label: "New password", value: newPw, onChange: setNewPw, placeholder: "Min. 6 characters" },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
              <input type="password" required value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm new password</label>
            <input type="password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                confirmPw && confirmPw !== newPw ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"
              }`} />
            {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
          </div>
          <button type="submit" disabled={pwSaving}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {pwSaving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
