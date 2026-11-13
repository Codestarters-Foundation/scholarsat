"use client";
import Link from "next/link";
import { useState } from "react";
import { Progress, Ring } from "./ui";
import { Owl } from "./Owl";

export type DomainRow = { name: string; href: string; seen: number; acc: number };
export type SectionRows = { key: string; label: string; seen: number; domains: DomainRow[] };

/** Body of the dashboard's Your Progress card. Layout stacks, so it holds up at any card width. */
export function ProgressBody({
  predicted,
  unique,
  correct,
  bankTotal,
  sections,
}: {
  predicted: { total: number; rw: number; math: number } | null;
  unique: number;
  correct: number;
  bankTotal: number;
  sections: SectionRows[];
}) {
  const [tab, setTab] = useState(sections[0].key);
  const cur = sections.find((s) => s.key === tab) ?? sections[0];
  const acc = unique ? correct / unique : null;

  return (
    <div>
      {/* Hero: score on the left, accuracy ring on the right */}
      <div className="flex items-center justify-between gap-5 rounded-2xl bg-surface p-5">
        <div className="min-w-0">
          <p className="text-xs text-muted">Predicted score</p>
          {predicted ? (
            <>
              <p className="mt-1 text-[44px] leading-none font-medium text-red tabular-nums">{predicted.total}</p>
              <p className="mt-2 text-xs text-muted tabular-nums">R&amp;W {predicted.rw} · Math {predicted.math}</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-[44px] leading-none font-medium text-faint">–</p>
              <p className="mt-2 text-xs text-muted">Answer 10 in each section to unlock</p>
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Ring value={acc} size={76} stroke={8} tone="ok" />
          <p className="text-xs text-muted tabular-nums">{correct} of {unique} correct</p>
        </div>
      </div>

      {/* Bank completion */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="text-muted">Questions answered</span>
          <span className="tabular-nums"><span className="font-medium">{unique.toLocaleString()}</span> <span className="text-muted">/ {bankTotal.toLocaleString()}</span></span>
        </div>
        <Progress value={unique / bankTotal} tone="red" className="h-2" />
      </div>

      {/* Unlock nudge, stacked so labels never collide */}
      {!predicted && (
        <div className="mt-4 rounded-2xl border border-dashed border-line-strong p-4">
          <div className="flex items-center gap-3">
            <Owl size={36} />
            <p className="text-sm font-medium">Unlock your predicted score</p>
          </div>
          <div className="mt-3 grid gap-2.5">
            {sections.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex justify-between text-xs text-muted"><span>{s.label}</span><span className="tabular-nums">{Math.min(10, s.seen)} / 10</span></div>
                <Progress value={Math.min(1, s.seen / 10)} tone="gold" className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill areas, one section at a time */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Skill areas</p>
        <div className="inline-flex rounded-lg bg-surface-2 p-0.5" role="tablist" aria-label="Section">
          {sections.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={tab === s.key}
              onClick={() => setTab(s.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === s.key ? "bg-white text-red shadow-card" : "text-muted hover:text-ink"}`}
            >
              {s.key === "rw" ? "Reading & Writing" : s.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-4 grid gap-4">
        {cur.domains.map((d) => (
          <li key={d.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <Link href={d.href} className="min-w-0 flex-1 hover:text-red">{d.name}</Link>
              <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted">
                {d.seen ? <><span className="text-sm font-medium text-ink">{Math.round(d.acc * 100)}%</span> · {d.seen} answered</> : "Not started"}
              </span>
            </div>
            <Progress value={d.acc} tone={d.seen && d.acc >= 0.7 ? "ok" : d.seen && d.acc < 0.5 ? "red" : "gold"} />
          </li>
        ))}
      </ul>
    </div>
  );
}
