"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Card } from "./ui";

const input = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red focus:ring-1 focus:ring-red";

function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <Card className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <div>{children}</div>
    </Card>
  );
}

export function SettingsForms({ user }: { user: { name: string; email: string; target_score: number | null; test_date: string | null } }) {
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
    <div className="grid gap-6">
      <Section title="Profile & goal" desc="Your target score and test date personalize the dashboard.">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await send("profile", { action: "profile", ...fd(e) }, "Saved.")) router.refresh(); }}>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Name<input name="name" defaultValue={user.name} className={input} required /></label>
          <label className="grid gap-1.5 text-sm font-medium">Target score<input name="target_score" type="number" min={400} max={1600} step={10} defaultValue={user.target_score ?? ""} placeholder="e.g. 1450" className={input} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Test date<input name="test_date" type="date" defaultValue={user.test_date ?? ""} className={input} /></label>
          <div className="sm:col-span-2"><Button type="submit">Save changes</Button><Msg k="profile" /></div>
        </form>
      </Section>
      <Section title="Password" desc={`Signed in as ${user.email}.`}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; if (await send("pw", { action: "password", ...fd(e) }, "Password updated.")) f.reset(); }}>
          <label className="grid gap-1.5 text-sm font-medium">Current password<input name="current" type="password" autoComplete="current-password" className={input} required /></label>
          <label className="grid gap-1.5 text-sm font-medium">New password<input name="next" type="password" autoComplete="new-password" minLength={8} className={input} required /></label>
          <div className="sm:col-span-2"><Button type="submit" variant="secondary">Update password</Button><Msg k="pw" /></div>
        </form>
      </Section>
      <Section title="Reset progress" desc="Clears your answer history and practice tests. Your account stays.">
        <Button variant="secondary" onClick={async () => { if (confirm("Reset all progress? This can't be undone.")) { if (await send("reset", { action: "reset" }, "Progress reset.")) router.refresh(); } }}>Reset my progress</Button>
        <Msg k="reset" />
      </Section>
      <Section title="Delete account" desc="Permanently deletes your account and all of your data.">
        <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); if (!confirm("Permanently delete your account?")) return; if (await send("del", { action: "delete", ...fd(e) }, "Account deleted.")) { router.push("/"); router.refresh(); } }}>
          <label className="grid flex-1 gap-1.5 text-sm font-medium">Confirm with your password<input name="password" type="password" autoComplete="current-password" className={input} required /></label>
          <button type="submit" className="rounded-xl border border-bad/30 bg-bad-50 px-4 py-2.5 text-sm font-semibold text-bad hover:bg-bad hover:text-white">Delete account</button>
        </form>
        <Msg k="del" />
      </Section>
    </div>
  );
}
