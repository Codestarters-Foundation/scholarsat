"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ordinal, percentile } from "@/lib/onboarding";
import { estimateFromRaw } from "@/lib/scoring";
import { IX } from "../icons";

type Raw = { rw1: number; rw2: number; m1: number; m2: number };

function Module({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl bg-surface p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow text-muted">{label}</span>
        <span className="flex items-baseline gap-1 tabular-nums">
          <input
            type="number"
            min={0}
            max={max}
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(max, Math.round(Number(e.target.value) || 0))))}
            aria-label={`${label} correct answers`}
            className="w-12 rounded-md border border-transparent bg-transparent text-right text-[17px] font-medium outline-none hover:border-line-strong focus:border-red"
          />
          <span className="text-sm text-faint">/{max}</span>
        </span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label} slider`} className="score-range mt-2" style={{ ["--track" as string]: `linear-gradient(to right, var(--red) ${(value / max) * 100}%, var(--surface-2) 0)` }} />
    </div>
  );
}

/** "What would my score be?" calculator. Opens as a dialog; estimate only. */
export function ScoreCalculator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [raw, setRaw] = useState<Raw>({ rw1: 14, rw2: 14, m1: 11, m2: 11 });
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  const est = estimateFromRaw(raw);
  const set = (p: Partial<Raw>) => setRaw((r) => ({ ...r, ...p }));

  // Portaled to <body>: an animated page container would otherwise become the "fixed" containing block.
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="calc-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-rise overflow-hidden rounded-2xl bg-white shadow-pop">
        <div className="flex items-center justify-between border-t-4 border-red-700 bg-red px-5 py-3.5 text-white">
          <h2 id="calc-title" className="text-[18px] font-medium">Score Calculator</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30" aria-label="Close"><IX className="h-4 w-4" /></button>
        </div>
        <div className="eyebrow flex justify-between bg-ink px-5 py-1.5 text-white/90"><span>SAT score estimate</span><span>~{ordinal(percentile(est.total))} percentile</span></div>
        <div className="bg-gold-50 px-5 py-6 text-center">
          <p className="eyebrow text-ink">Your estimated score</p>
          <p className="mt-1 text-[64px] leading-none font-medium text-gold tabular-nums">{est.total}</p>
          <p className="mt-1 text-sm text-muted">400–1600</p>
        </div>
        <div className="grid gap-5 p-5">
          <section>
            <div className="mb-2 flex items-baseline justify-between"><h3 className="text-[16px] font-medium">Reading and Writing</h3><span className="text-[17px] font-medium text-gold tabular-nums">{est.rw}</span></div>
            <div className="grid grid-cols-2 gap-3"><Module label="Module 1" value={raw.rw1} max={27} onChange={(v) => set({ rw1: v })} /><Module label="Module 2" value={raw.rw2} max={27} onChange={(v) => set({ rw2: v })} /></div>
          </section>
          <section>
            <div className="mb-2 flex items-baseline justify-between"><h3 className="text-[16px] font-medium">Math</h3><span className="text-[17px] font-medium text-gold tabular-nums">{est.math}</span></div>
            <div className="grid grid-cols-2 gap-3"><Module label="Module 1" value={raw.m1} max={22} onChange={(v) => set({ m1: v })} /><Module label="Module 2" value={raw.m2} max={22} onChange={(v) => set({ m2: v })} /></div>
          </section>
          <p className="text-center text-xs text-faint">This is an estimate from one simple curve. The real test&apos;s curve changes from exam to exam.</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
