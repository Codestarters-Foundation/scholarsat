import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-red text-white hover:bg-red-600 shadow-[0_1px_0_rgba(0,0,0,0.08)]",
  secondary: "border border-line bg-white text-ink hover:border-red/40 hover:bg-red-50",
  ghost: "text-muted hover:bg-surface hover:text-ink",
  gold: "bg-gold text-white hover:bg-gold-600",
};

export function Button({ variant = "primary", className = "", ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...p} />;
}

export function LinkButton({ variant = "primary", className = "", ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...p} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</div>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "red" | "gold" | "ok" | "bad"; children: ReactNode }) {
  const t = {
    neutral: "bg-surface text-muted border-line",
    red: "bg-red-50 text-red border-red-100",
    gold: "bg-gold-50 text-gold-600 border-gold-100",
    ok: "bg-ok-50 text-ok border-ok/20",
    bad: "bg-bad-50 text-bad border-bad/20",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Progress({ value, tone = "red" }: { value: number; tone?: "red" | "gold" | "ok" }) {
  const c = { red: "bg-red", gold: "bg-gold", ok: "bg-ok" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export const DIFF_TONE = { E: "ok", M: "gold", H: "red" } as const;
