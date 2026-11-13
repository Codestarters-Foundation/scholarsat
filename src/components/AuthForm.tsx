"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";

const input = "w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-red focus:ring-1 focus:ring-red";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const body = Object.fromEntries(new FormData(e.currentTarget));
        const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (r.ok) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setErr((await r.json()).error ?? "Something went wrong.");
          setBusy(false);
        }
      }}
    >
      {mode === "signup" && (
        <label className="grid gap-1.5 text-sm font-medium">First name<input name="name" autoComplete="given-name" className={input} required maxLength={60} /></label>
      )}
      <label className="grid gap-1.5 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" className={input} required /></label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 8 : undefined} className={input} required />
        {mode === "signup" && <span className="text-xs font-normal text-muted">At least 8 characters.</span>}
      </label>
      {err && <p role="alert" className="rounded-lg bg-bad-50 px-3 py-2 text-sm text-bad">{err}</p>}
      <Button type="submit" disabled={busy} className="py-3">{busy ? "One moment…" : mode === "login" ? "Log in" : "Create free account"}</Button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>New to ScholarSAT? <Link href="/signup" className="font-semibold text-red hover:underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-semibold text-red hover:underline">Log in</Link></>
        )}
      </p>
    </form>
  );
}
