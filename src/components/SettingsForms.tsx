"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, btn } from "./ui";
import { IGoogle } from "./icons";

export const inputCls =
  "w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-red focus:ring-3 focus:ring-red/15";

function Section({ title, desc, children, danger }: { title: string; desc: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={`grid gap-6 rounded-2xl border bg-white p-6 shadow-card md:grid-cols-[260px_1fr] ${danger ? "border-bad-100" : "border-line"}`}>
      <div>
        <h2 className={`text-[17px] font-medium ${danger ? "text-bad" : ""}`}>{title}</h2>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

type Props = {
  user: { name: string; email: string; target_score: number | null; test_date: string | null };
  hasPassword: boolean;
  googleLinked: boolean;
  googleAvailable: boolean;
};

export function SettingsForms({ user, hasPassword, googleLinked, googleAvailable }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  const send = async (key: string, body: object, okText: string) => {
    const r = await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    setMsg((m) => ({ ...m, [key]: r.ok ? { ok: true, text: okText } : { ok: false, text: j.error ?? "Something went wrong." } }));
    return r.ok;
  };
  const Msg = ({ k }: { k: string }) => (msg[k] ? <p role="status" className={`mt-3 text-sm ${msg[k].ok ? "text-ok" : "text-bad"}`}>{msg[k].text}</p> : null);
  const fd = (e: FormEvent<HTMLFormElement>) => Object.fromEntries(new FormData(e.currentTarget));

  return (
    <div className="grid gap-5">
      <Section title="Profile & goal" desc="Your target score and test date personalize your home page.">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await send("profile", { action: "profile", ...fd(e) }, "Saved.")) router.refresh(); }}>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Name<input name="name" defaultValue={user.name} className={inputCls} required /></label>
          <label className="grid gap-1.5 text-sm font-medium">Target score<input name="target_score" type="number" min={400} max={1600} step={10} defaultValue={user.target_score ?? ""} placeholder="e.g. 1450" className={inputCls} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Test date<input name="test_date" type="date" defaultValue={user.test_date ?? ""} className={inputCls} /></label>
          <div className="sm:col-span-2"><Button type="submit">Save changes</Button><Msg k="profile" /></div>
        </form>
      </Section>

      <Section title="Sign-in methods" desc={`Signed in as ${user.email}.`}>
        <div className="grid gap-5">
          {(googleAvailable || googleLinked) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white"><IGoogle className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-xs text-muted">{googleLinked ? "Connected" : "Not connected"}</p>
                </div>
              </div>
              {googleLinked ? (
                hasPassword && (
                  <Button variant="secondary" size="sm" onClick={async () => { if (await send("google", { action: "unlink_google" }, "Google disconnected.")) router.refresh(); }}>Disconnect</Button>
                )
              ) : (
                <a href="/api/auth/google?link=1&next=/settings" className={btn("secondary", "sm")}>Connect Google</a>
              )}
            </div>
          )}
          <Msg k="google" />
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; if (await send("pw", { action: "password", ...fd(e) }, hasPassword ? "Password updated." : "Password set. You can now log in with email too.")) { f.reset(); router.refresh(); } }}>
            {hasPassword && <label className="grid gap-1.5 text-sm font-medium">Current password<input name="current" type="password" autoComplete="current-password" className={inputCls} required /></label>}
            <label className="grid gap-1.5 text-sm font-medium">{hasPassword ? "New password" : "Set a password"}<input name="next" type="password" autoComplete="new-password" minLength={8} className={inputCls} required /></label>
            <div className="sm:col-span-2"><Button type="submit" variant="secondary">{hasPassword ? "Update password" : "Set password"}</Button><Msg k="pw" /></div>
          </form>
        </div>
      </Section>

      <Section title="Reset progress" desc="Clears your answer history and practice tests. Your account stays.">
        <Button variant="secondary" onClick={async () => { if (confirm("Reset all progress? This can't be undone.")) { if (await send("reset", { action: "reset" }, "Progress reset.")) router.refresh(); } }}>Reset my progress</Button>
        <Msg k="reset" />
      </Section>

      <Section title="Delete account" desc="Permanently deletes your account and all of your data." danger>
        <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); if (!confirm("Permanently delete your account?")) return; if (await send("del", { action: "delete", ...fd(e) }, "Account deleted.")) { router.push("/"); router.refresh(); } }}>
          {hasPassword ? (
            <label className="grid flex-1 gap-1.5 text-sm font-medium">Confirm with your password<input name="password" type="password" autoComplete="current-password" className={inputCls} required /></label>
          ) : (
            <label className="grid flex-1 gap-1.5 text-sm font-medium">Type <span className="font-mono text-xs">{user.email}</span> to confirm<input name="password" type="text" autoComplete="off" className={inputCls} required /></label>
          )}
          <button type="submit" className="btn-3d rounded-xl border-b-[#7f1a12] bg-bad px-4 py-2 text-sm font-medium text-white">Delete account</button>
        </form>
        <Msg k="del" />
      </Section>
    </div>
  );
}
