"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";
import { IGoogle } from "./icons";
import { useOwlShy } from "./AuthShell";

const input =
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] outline-none transition-shadow placeholder:text-faint focus:border-red focus:ring-4 focus:ring-red/10";

const ERRORS: Record<string, string> = {
  google: "Google sign-in didn't work. Please try again.",
  google_state: "That sign-in link expired. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  google_disabled: "Google sign-in isn't set up on this server yet.",
  rate: "Too many attempts. Wait a few minutes and try again.",
};

const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

export function AuthForm({ mode, google, error, next }: { mode: "login" | "signup"; google: boolean; error?: string; next?: string }) {
  const router = useRouter();
  const setShy = useOwlShy();
  const [err, setErr] = useState(error ? (ERRORS[error] ?? ERRORS.google) : "");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <div className="grid gap-6">
      {google && (
        <>
          <a
            href={`/api/auth/google?next=${encodeURIComponent(dest)}`}
            className="btn-3d inline-flex w-full items-center justify-center gap-3 rounded-xl border border-line-strong border-b-line-strong bg-white px-4 py-3 text-[15px] font-medium text-ink hover:bg-surface"
          >
            <IGoogle className="h-5 w-5" /> Continue with Google
          </a>
          <div className="flex items-center gap-4 text-xs text-faint">
            <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form
        className="grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const body = Object.fromEntries(new FormData(e.currentTarget));
          const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          if (r.ok) {
            router.push(dest);
            router.refresh();
          } else {
            setErr((await r.json()).error ?? "Something went wrong.");
            setBusy(false);
          }
        }}
      >
        {mode === "signup" && (
          <label className="grid gap-2 text-sm font-medium">First name<input name="name" autoComplete="given-name" placeholder="Alex" className={input} required maxLength={60} /></label>
        )}
        <label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" placeholder="you@school.edu" className={input} required /></label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <span className="relative block">
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 8 : undefined}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              className={`${input} pr-12`}
              required
              onFocus={() => setShy(!show)}
              onBlur={() => setShy(false)}
            />
            <button
              type="button"
              onClick={() => { setShow((s) => !s); setShy(show); }}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
            >
              <Eye off={show} />
            </button>
          </span>
        </label>
        {err && <p role="alert" className="rounded-xl border border-bad-100 bg-bad-50 px-4 py-3 text-sm text-bad">{err}</p>}
        <Button type="submit" disabled={busy} size="lg" className="w-full py-3.5">{busy ? "One moment…" : mode === "login" ? "Log in" : "Create free account"}</Button>
      </form>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>New to ScholarSAT? <Link href="/signup" className="font-medium text-red hover:underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-medium text-red hover:underline">Log in</Link></>
        )}
      </p>
    </div>
  );
}
