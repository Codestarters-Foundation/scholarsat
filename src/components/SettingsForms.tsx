"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, type FormEvent, type ReactNode } from "react";
import { Button, btn, Avatar } from "./ui";
import {
  IGoogle,
  ISun,
  IMoon,
  ILaptop,
  ISmartphone,
  IShield,
  IUser,
  IPalette,
  ITrash,
  IKey,
  ICheck,
  ICheckCircle,
  IRefresh,
  ITarget,
  IGear,
  IGraduationCap,
  IFire,
  IStar,
  IBook,
  ITrophy,
  ISparkle,
  ICompass,
} from "./icons";
import { useTheme, type Theme, type AccentColor } from "./ThemeProvider";
import type { ActiveSession } from "@/lib/auth";

export const inputCls =
  "w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-red focus:ring-3 focus:ring-red/15";

function Section({
  title,
  desc,
  children,
  danger,
  icon,
}: {
  title: string;
  desc: string;
  children: ReactNode;
  danger?: boolean;
  icon?: ReactNode;
}) {
  return (
    <section
      className={`grid gap-6 rounded-2xl border bg-white p-6 shadow-card md:grid-cols-[260px_1fr] transition-colors ${
        danger ? "border-bad-100 dark:border-bad/40" : "border-line"
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className={`text-muted ${danger ? "text-bad" : ""}`}>{icon}</span>}
          <h2 className={`text-[17px] font-medium ${danger ? "text-bad" : "text-ink"}`}>{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2 ${
          checked ? "bg-red" : "bg-surface-2"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
          style={{ backgroundColor: "#ffffff" }}
        />
      </button>
    </div>
  );
}

type Props = {
  user: {
    id: number;
    name: string;
    email: string;
    target_score: number | null;
    test_date: string | null;
    avatar?: string | null;
    theme?: string | null;
    accent_color?: string | null;
    compact_mode?: number | null;
    reduce_animations?: number | null;
  };
  hasPassword: boolean;
  googleLinked: boolean;
  googleAvailable: boolean;
  activeSessions: ActiveSession[];
};

const PRESET_AVATARS: { id: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "cap", label: "Grad Cap", Icon: IGraduationCap },
  { id: "flame", label: "Streak", Icon: IFire },
  { id: "star", label: "Star", Icon: IStar },
  { id: "target", label: "Target", Icon: ITarget },
  { id: "book", label: "Book", Icon: IBook },
  { id: "trophy", label: "Trophy", Icon: ITrophy },
  { id: "spark", label: "Spark", Icon: ISparkle },
  { id: "compass", label: "Compass", Icon: ICompass },
];

const ACCENT_COLORS: { id: AccentColor; name: string; hex: string; bgClass: string }[] = [
  { id: "red", name: "Crimson", hex: "#a50c26", bgClass: "bg-[#a50c26]" },
  { id: "gold", name: "Gold", hex: "#c1912f", bgClass: "bg-[#c1912f]" },
  { id: "blue", name: "Indigo", hex: "#2563eb", bgClass: "bg-[#2563eb]" },
  { id: "green", name: "Emerald", hex: "#15803d", bgClass: "bg-[#15803d]" },
  { id: "purple", name: "Violet", hex: "#7c3aed", bgClass: "bg-[#7c3aed]" },
  { id: "rose", name: "Rose", hex: "#e11d48", bgClass: "bg-[#e11d48]" },
];

export function SettingsForms({ user, hasPassword, googleLinked, googleAvailable, activeSessions: initialSessions }: Props) {
  const router = useRouter();
  const { theme, setTheme, accent, setAccent, compact, setCompact, reduceMotion, setReduceMotion } = useTheme();

  const [activeTab, setActiveTab] = useState<"appearance" | "account" | "security" | "study">("appearance");
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(user.avatar ?? null);
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = async (key: string, body: object, okText: string) => {
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      setMsg((m) => ({
        ...m,
        [key]: r.ok ? { ok: true, text: okText } : { ok: false, text: j.error ?? "Something went wrong." },
      }));
      return r.ok;
    } catch {
      setMsg((m) => ({ ...m, [key]: { ok: false, text: "Network error. Please try again." } }));
      return false;
    }
  };

  const Msg = ({ k }: { k: string }) =>
    msg[k] ? (
      <p
        role="status"
        className={`mt-3 inline-flex items-center gap-1.5 text-sm ${msg[k].ok ? "text-ok" : "text-bad"}`}
      >
        {msg[k].ok && <ICheckCircle className="h-4 w-4" />}
        {msg[k].text}
      </p>
    ) : null;

  const fd = (e: FormEvent<HTMLFormElement>) => Object.fromEntries(new FormData(e.currentTarget));

  // Custom photo upload handler (resizes to 256x256 WebP/JPEG data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMsg((m) => ({ ...m, avatar: { ok: false, text: "Please choose an image file (PNG, JPEG, WebP)." } }));
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setUploadingAvatar(false);
          return;
        }

        // Center square crop
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, 256, 256);

        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        setCurrentAvatar(dataUrl);

        const ok = await send("avatar", { action: "avatar", avatar: dataUrl }, "Profile photo updated.");
        if (ok) router.refresh();
        setUploadingAvatar(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = async (presetId: string) => {
    setCurrentAvatar(presetId);
    const ok = await send("avatar", { action: "avatar", avatar: presetId }, "Avatar updated.");
    if (ok) router.refresh();
  };

  const handleClearAvatar = async () => {
    setCurrentAvatar(null);
    const ok = await send("avatar", { action: "avatar", avatar: "" }, "Avatar reset to initials.");
    if (ok) router.refresh();
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Revoke this session? That device will be signed out.")) return;
    const ok = await send("session", { action: "revoke_session", session_id: sessionId }, "Session revoked.");
    if (ok) {
      setSessions((s) => s.filter((item) => item.id !== sessionId));
    }
  };

  const handleSignOutOthers = async () => {
    if (!confirm("Sign out of all other devices? Only your current device will stay logged in.")) return;
    const ok = await send("sign_out_others", { action: "sign_out_others" }, "Signed out of all other devices.");
    if (ok) {
      setSessions((s) => s.filter((item) => item.isCurrent));
    }
  };

  const handleSignOutAll = async () => {
    if (!confirm("Sign out of all devices including this one?")) return;
    await send("sign_out_all", { action: "sign_out_all" }, "Signed out everywhere.");
    router.push("/");
    router.refresh();
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Active right now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div className="grid gap-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-line overflow-x-auto scroll-thin pb-px" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "appearance"}
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "appearance"
              ? "border-red text-red font-semibold"
              : "border-transparent text-muted hover:text-ink hover:border-line-strong"
          }`}
        >
          <IPalette className="h-4 w-4" /> Appearance
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "account"}
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "account"
              ? "border-red text-red font-semibold"
              : "border-transparent text-muted hover:text-ink hover:border-line-strong"
          }`}
        >
          <IUser className="h-4 w-4" /> Account
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "security"}
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "security"
              ? "border-red text-red font-semibold"
              : "border-transparent text-muted hover:text-ink hover:border-line-strong"
          }`}
        >
          <IShield className="h-4 w-4" /> Security
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "study"}
          onClick={() => setActiveTab("study")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "study"
              ? "border-red text-red font-semibold"
              : "border-transparent text-muted hover:text-ink hover:border-line-strong"
          }`}
        >
          <ITarget className="h-4 w-4" /> Goal & Data
        </button>
      </div>

      {/* ---------------- 1. APPEARANCE TAB ---------------- */}
      {activeTab === "appearance" && (
        <div className="grid gap-5 animate-rise">
          {/* Theme Selection */}
          <Section
            icon={<ISun className="h-5 w-5" />}
            title="Theme"
            desc="Choose light, dark, or sync automatically with your system appearance."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "light" as Theme, label: "Light", icon: ISun, desc: "Classic white canvas" },
                { id: "dark" as Theme, label: "Dark", icon: IMoon, desc: "Easy on the eyes" },
                { id: "system" as Theme, label: "System", icon: ILaptop, desc: "Syncs with OS" },
              ].map(({ id, label, icon: Icon, desc }) => {
                const isSelected = theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-red bg-red-50/40 dark:bg-red-950/20 shadow-xs"
                        : "border-line bg-white hover:border-line-strong"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isSelected ? "text-red" : "text-muted"}`} />
                        <span className={`text-sm font-medium ${isSelected ? "text-red" : "text-ink"}`}>
                          {label}
                        </span>
                      </div>
                      <span
                        className={`grid h-4 w-4 place-items-center rounded-full border text-[10px] ${
                          isSelected ? "border-red bg-red text-white" : "border-line-strong bg-white"
                        }`}
                      >
                        {isSelected && <ICheck className="h-3 w-3 stroke-[3]" />}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{desc}</p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Accent Color */}
          <Section
            icon={<IPalette className="h-5 w-5" />}
            title="Accent color"
            desc="Personalize the primary highlight color used for buttons, badges, and progress meters."
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACCENT_COLORS.map((c) => {
                const isSelected = accent === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAccent(c.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-ink-2 bg-surface shadow-xs ring-2 ring-ink/10"
                        : "border-line bg-white hover:border-line-strong"
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full shrink-0 shadow-xs border border-black/10 ${c.bgClass}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                    </div>
                    {isSelected && <ICheck className="h-4 w-4 text-ink shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Density & Motion */}
          <Section
            icon={<IGear className="h-5 w-5" />}
            title="Interface density & motion"
            desc="Tune spacing and animations to your viewing preference."
          >
            <div className="divide-y divide-line">
              <Toggle
                checked={compact}
                onChange={setCompact}
                label="Compact mode"
                desc="Tighter padding on cards, tables, and nav headers so more content fits on screen."
              />
              <Toggle
                checked={reduceMotion}
                onChange={setReduceMotion}
                label="Reduce animations"
                desc="Disables screen shakes, glint sweeps, flame flickers, and animated card transitions."
              />
            </div>
          </Section>
        </div>
      )}

      {/* ---------------- 2. ACCOUNT TAB ---------------- */}
      {activeTab === "account" && (
        <div className="grid gap-5 animate-rise">
          {/* Profile Picture */}
          <Section
            icon={<IUser className="h-5 w-5" />}
            title="Profile picture"
            desc="Choose a Scholar avatar or upload your own profile photo."
          >
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={user.name} avatar={currentAvatar} size={64} className="border-2 border-line" />
                <div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingAvatar ? "Uploading..." : "Upload photo"}
                    </Button>
                    {currentAvatar && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleClearAvatar}>
                        Use initials
                      </Button>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">Supports PNG, JPG, or WebP up to 5MB.</p>
                </div>
              </div>

              {/* Preset Vector Avatars */}
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2.5">
                  Or select a profile icon
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((a) => {
                    const isSelected = currentAvatar === a.id;
                    const IconComp = a.Icon;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(a.id)}
                        title={a.label}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? "border-red bg-red-50 dark:bg-red-950/40 ring-2 ring-red/20 text-red"
                            : "border-line bg-surface hover:bg-surface-2 text-ink-2"
                        }`}
                      >
                        <span className="grid h-7 w-7 place-items-center">
                          <IconComp className="h-5 w-5" />
                        </span>
                        <span className="mt-1 text-[11px] font-medium truncate w-full text-center">
                          {a.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Msg k="avatar" />
            </div>
          </Section>

          {/* Display Name */}
          <Section
            icon={<IUser className="h-5 w-5" />}
            title="Display name"
            desc="Your name appears on your dashboard and question review cards."
          >
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await send("name", { action: "display_name", ...fd(e) }, "Display name updated.")) {
                  router.refresh();
                }
              }}
            >
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                Name
                <input name="name" defaultValue={user.name} className={inputCls} required maxLength={60} />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Save name</Button>
                <Msg k="name" />
              </div>
            </form>
          </Section>

          {/* Email Address */}
          <Section
            icon={<IUser className="h-5 w-5" />}
            title="Email address"
            desc="Used for account sign in and study goal reminders."
          >
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await send("email", { action: "email", ...fd(e) }, "Email address updated.")) {
                  router.refresh();
                }
              }}
            >
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                Email
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className={inputCls}
                  required
                />
              </label>
              {hasPassword && (
                <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                  Confirm current password to change email
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    className={inputCls}
                    required
                  />
                </label>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  Update email
                </Button>
                <Msg k="email" />
              </div>
            </form>
          </Section>

          {/* Change Password */}
          <Section
            icon={<IKey className="h-5 w-5" />}
            title={hasPassword ? "Change password" : "Set password"}
            desc={
              hasPassword
                ? "Choose a strong password to protect your account."
                : "You signed in with Google. Set a password to also log in with your email."
            }
          >
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                if (
                  await send(
                    "pw",
                    { action: "password", ...fd(e) },
                    hasPassword ? "Password updated successfully." : "Password set successfully."
                  )
                ) {
                  form.reset();
                  router.refresh();
                }
              }}
            >
              {hasPassword && (
                <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                  Current password
                  <input
                    name="current"
                    type="password"
                    autoComplete="current-password"
                    className={inputCls}
                    required
                  />
                </label>
              )}
              <label className="grid gap-1.5 text-sm font-medium">
                {hasPassword ? "New password" : "Create password"}
                <input
                  name="next"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Min 8 characters"
                  className={inputCls}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Confirm new password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Re-type new password"
                  className={inputCls}
                  required
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  {hasPassword ? "Update password" : "Set password"}
                </Button>
                <Msg k="pw" />
              </div>
            </form>
          </Section>

          {/* Delete Account */}
          <Section
            icon={<ITrash className="h-5 w-5" />}
            title="Delete account"
            desc="Permanently deletes your account and all practice history. This cannot be undone."
            danger
          >
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!confirm("Permanently delete your account and all associated test data?")) return;
                if (await send("del", { action: "delete", ...fd(e) }, "Account deleted.")) {
                  router.push("/");
                  router.refresh();
                }
              }}
            >
              <div className="rounded-xl bg-bad-50 dark:bg-bad/15 border border-bad-100 dark:border-bad/30 p-3.5 text-xs text-bad">
                Warning: Once your account is deleted, your question history, test scores, bookmarks, and vocabulary progress will be permanently erased.
              </div>
              <div className="flex flex-wrap items-end gap-3">
                {hasPassword ? (
                  <label className="grid flex-1 gap-1.5 text-sm font-medium">
                    Confirm with your password
                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className={inputCls}
                      required
                    />
                  </label>
                ) : (
                  <label className="grid flex-1 gap-1.5 text-sm font-medium">
                    Type <span className="font-mono text-xs">{user.email}</span> to confirm
                    <input name="password" type="text" autoComplete="off" className={inputCls} required />
                  </label>
                )}
                <button
                  type="submit"
                  className="btn-3d rounded-xl border-b-[#7f1a12] bg-bad px-4 py-2.5 text-sm font-medium text-white hover:brightness-105"
                >
                  Delete account
                </button>
              </div>
              <Msg k="del" />
            </form>
          </Section>
        </div>
      )}

      {/* ---------------- 3. SECURITY TAB ---------------- */}
      {activeTab === "security" && (
        <div className="grid gap-5 animate-rise">
          {/* Active Sessions */}
          <Section
            icon={<IShield className="h-5 w-5" />}
            title="Active sessions"
            desc="Devices where your account is currently signed in. You can revoke any unrecognized session."
          >
            <div className="grid gap-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-muted font-medium uppercase tracking-wider">
                  {sessions.length} active session{sessions.length === 1 ? "" : "s"}
                </span>
                {sessions.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={handleSignOutOthers}>
                    Sign out other devices
                  </Button>
                )}
              </div>

              <div className="divide-y divide-line rounded-xl border border-line bg-surface/50 overflow-hidden">
                {sessions.map((sess) => {
                  const isMobile = sess.deviceType === "mobile" || sess.deviceType === "tablet";
                  const DeviceIcon = isMobile ? ISmartphone : ILaptop;

                  return (
                    <div
                      key={sess.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-surface"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted">
                          <DeviceIcon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-ink">
                              {sess.browser} on {sess.os}
                            </p>
                            {sess.isCurrent && (
                              <span className="inline-flex items-center rounded-full bg-ok-50 text-ok px-2 py-0.5 text-[11px] font-medium border border-ok/20">
                                This device
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {sess.ip ? `${sess.ip} · ` : ""}
                            {formatRelativeTime(sess.lastActive)}
                          </p>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="text-bad hover:bg-bad-50 dark:hover:bg-bad/20"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <Msg k="session" />
              <Msg k="sign_out_others" />

              {/* Sign out of all devices */}
              <div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Sign out everywhere</p>
                  <p className="text-xs text-muted">End all sessions on every device, including this one.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSignOutAll}>
                  Sign out of all devices
                </Button>
              </div>
              <Msg k="sign_out_all" />
            </div>
          </Section>

          {/* Connected Accounts */}
          {(googleAvailable || googleLinked) && (
            <Section
              icon={<IGoogle className="h-5 w-5" />}
              title="Google sign-in"
              desc="Link or unlink your Google account for single-click sign in."
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white">
                    <IGoogle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Google</p>
                    <p className="text-xs text-muted">{googleLinked ? "Connected" : "Not connected"}</p>
                  </div>
                </div>
                {googleLinked ? (
                  hasPassword && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (await send("google", { action: "unlink_google" }, "Google disconnected.")) {
                          router.refresh();
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                  )
                ) : (
                  <a href="/api/auth/google?link=1&next=/settings" className={btn("secondary", "sm")}>
                    Connect Google
                  </a>
                )}
              </div>
              <Msg k="google" />
            </Section>
          )}
        </div>
      )}

      {/* ---------------- 4. GOAL & DATA TAB ---------------- */}
      {activeTab === "study" && (
        <div className="grid gap-5 animate-rise">
          {/* Study Target */}
          <Section
            icon={<ITarget className="h-5 w-5" />}
            title="Target score & test date"
            desc="Your target score and test date personalize your dashboard countdown and study plan."
          >
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await send("profile", { action: "profile", ...fd(e) }, "Goal updated.")) {
                  router.refresh();
                }
              }}
            >
              <label className="grid gap-1.5 text-sm font-medium">
                Target score (400–1600)
                <input
                  name="target_score"
                  type="number"
                  min={400}
                  max={1600}
                  step={10}
                  defaultValue={user.target_score ?? ""}
                  placeholder="e.g. 1500"
                  className={inputCls}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Test date
                <input
                  name="test_date"
                  type="date"
                  defaultValue={user.test_date ?? ""}
                  className={inputCls}
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Save goal</Button>
                <Msg k="profile" />
              </div>
            </form>
          </Section>

          {/* Reset Progress */}
          <Section
            icon={<IRefresh className="h-5 w-5" />}
            title="Reset practice progress"
            desc="Clears your question answer history, mock tests, and vocabulary progress. Your account remains."
          >
            <div>
              <p className="text-sm text-muted mb-4">
                Want to start from scratch? Resetting will clear all your answers and stats so you can practice questions afresh.
              </p>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (confirm("Reset all question history and test scores? This cannot be undone.")) {
                    if (await send("reset", { action: "reset" }, "Progress reset successfully.")) {
                      router.refresh();
                    }
                  }
                }}
              >
                Reset my progress
              </Button>
              <Msg k="reset" />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
