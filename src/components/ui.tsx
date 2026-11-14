import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Difficulty } from "@/lib/types";
import { IGraduationCap, IFire, IStar, ITarget, IBook, ITrophy, ISparkle, ICompass } from "./icons";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "success" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-50";
const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-[15px]",
};
const variants: Record<Variant, string> = {
  primary: "btn-3d btn-gloss bg-red text-white border-b-red-700",
  gold: "btn-3d btn-gloss bg-gold text-white border-b-gold-700",
  success: "btn-3d btn-gloss bg-ok-500 text-white border-b-ok-700",
  dark: "btn-3d btn-gloss bg-ink text-white border-b-black",
  secondary: "btn-3d border border-line-strong border-b-line-strong bg-white text-ink hover:bg-surface",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink transition-colors",
};

export function btn(variant: Variant = "primary", size: Size = "md") {
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

export function Button({ variant = "primary", size = "md", className = "", ...p }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${btn(variant, size)} ${className}`} {...p} />;
}

export function LinkButton({ variant = "primary", size = "md", className = "", ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${btn(variant, size)} ${className}`} {...p} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-white p-5 shadow-card ${className}`}>{children}</div>;
}

type Tone = "red" | "gold" | "ok" | "ink";
const HEADER_TONE: Record<Tone, string> = {
  red: "bg-red text-white border-t-red-700",
  gold: "bg-gold text-white border-t-gold-700",
  ok: "bg-ok-500 text-white border-t-ok-700",
  ink: "bg-ink text-white border-t-black",
};

/** Card with a solid colored header strip: the core dashboard surface. */
export function HeaderCard({
  title,
  tone = "red",
  right,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: ReactNode;
  tone?: Tone;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-line bg-white shadow-card ${className}`}>
      <header className={`flex min-h-14 items-center justify-between gap-3 border-t-4 px-5 py-3 ${HEADER_TONE[tone]}`}>
        <h2 className="min-w-0 text-[17px] font-medium">{title}</h2>
        {right && <div className="flex shrink-0 items-center gap-3 text-[13px] text-white/90">{right}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Badge({ tone = "neutral", children, className = "" }: { tone?: "neutral" | "red" | "gold" | "ok" | "bad" | "warn"; children: ReactNode; className?: string }) {
  const t = {
    neutral: "bg-surface-2 text-muted",
    red: "bg-red-50 text-red",
    gold: "bg-gold-50 text-gold-600",
    ok: "bg-ok-50 text-ok",
    bad: "bg-bad-50 text-bad",
    warn: "bg-warn-50 text-warn",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t} ${className}`}>{children}</span>;
}

const DIFF_BADGE: Record<Difficulty, { tone: "ok" | "warn" | "bad"; label: string }> = {
  E: { tone: "ok", label: "Easy" },
  M: { tone: "warn", label: "Medium" },
  H: { tone: "bad", label: "Hard" },
};
export function DiffBadge({ d, className }: { d: Difficulty; className?: string }) {
  return <Badge tone={DIFF_BADGE[d].tone} className={className}>{DIFF_BADGE[d].label}</Badge>;
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] leading-tight font-medium tracking-[-0.01em] text-ink">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow text-muted ${className}`}>{children}</p>;
}

export function Progress({ value, tone = "red", className = "h-2" }: { value: number; tone?: "red" | "gold" | "ok"; className?: string }) {
  const c = { red: "bg-red", gold: "bg-gold", ok: "bg-ok-500" }[tone];
  return (
    <div className={`w-full overflow-hidden rounded-full bg-surface-2 ${className}`} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${value > 0 ? "bar-fill" : ""} ${c}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

/** Circular percentage meter. */
export function Ring({ value, size = 64, stroke = 7, label, tone = "red" }: { value: number | null; size?: number; stroke?: number; label?: string; tone?: "red" | "ok" | "gold" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(1, value));
  const color = { red: "var(--red)", ok: "var(--ok-500)", gold: "var(--gold)" }[tone];
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {v > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} />}
      </svg>
      <span className="absolute font-medium tabular-nums" style={{ color: value === null ? "var(--faint)" : color, fontSize: Math.max(11, Math.round(size * 0.2)) }}>
        {label ?? (value === null ? "–" : `${Math.round(v * 100)}%`)}
      </span>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red">{icon}</div>}
      <p className="mt-4 text-[15px] font-medium text-ink">{title}</p>
      {children && <p className="mt-1.5 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  avatar,
  size = 36,
  className = "",
}: {
  name: string;
  avatar?: string | null;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join("") || "?";

  if (avatar && (avatar.startsWith("data:") || avatar.startsWith("http://") || avatar.startsWith("https://"))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className={`shrink-0 rounded-full object-cover border border-line ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Preset vector avatar icons
  const presetGradients: Record<string, string> = {
    cap: "from-red to-red-700",
    flame: "from-orange-500 to-red-600",
    star: "from-amber-500 to-yellow-600",
    target: "from-rose-500 to-red-700",
    book: "from-blue-600 to-indigo-800",
    trophy: "from-purple-600 to-indigo-800",
    spark: "from-gold-600 to-amber-700",
    compass: "from-emerald-600 to-teal-800",
  };

  const presetIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    cap: IGraduationCap,
    flame: IFire,
    star: IStar,
    target: ITarget,
    book: IBook,
    trophy: ITrophy,
    spark: ISparkle,
    compass: ICompass,
  };

  if (avatar && presetIcons[avatar]) {
    const IconComp = presetIcons[avatar]!;
    const grad = presetGradients[avatar] || "from-red to-gold";
    const iconDim = Math.max(16, Math.round(size * 0.52));
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${grad} text-white shadow-xs select-none ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span style={{ width: iconDim, height: iconDim }} className="grid place-items-center text-white">
          <IconComp className="w-full h-full text-white" />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-red to-gold font-medium text-white shadow-xs select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/** Decorative illustration for subject tiles. */
export function SubjectArt({ kind, className = "" }: { kind: "math" | "rw"; className?: string }) {
  if (kind === "math")
    return (
      <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
        <g transform="rotate(-28 100 100)">
          <rect x="40" y="10" width="130" height="190" rx="18" fill="currentColor" opacity="0.18" />
          <rect x="54" y="26" width="102" height="40" rx="8" fill="currentColor" opacity="0.22" />
          {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={56 + c * 34} y={80 + r * 28} width="26" height="20" rx="6" fill="currentColor" opacity="0.22" />))}
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g transform="rotate(-28 100 100)">
        <rect x="30" y="0" width="150" height="210" rx="18" fill="currentColor" opacity="0.16" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x="46" y={22 + i * 22} width={i % 3 === 2 ? 70 : 118} height="10" rx="5" fill="currentColor" opacity="0.24" />)}
      </g>
    </svg>
  );
}

export const DIFF_TONE = { E: "ok", M: "gold", H: "red" } as const;
