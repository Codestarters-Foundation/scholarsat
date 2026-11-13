"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TAXONOMY, SECTION_LABEL, type Section, type Difficulty } from "@/lib/types";
import { Button, Progress, Ring, SubjectArt } from "./ui";
import { ICheck, ICheckCircle, IPlay, IXCircle } from "./icons";

export type SkillInfo = { total: number; byDiff: Record<Difficulty, number>; answered: number; correct: number; wrong: number };

export function PracticeFilters({
  initialSection,
  skills,
}: {
  initialSection: Section;
  skills: Record<string, SkillInfo>;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(initialSection);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sectionTotals = useMemo(() => {
    const out = {} as Record<Section, { total: number; answered: number }>;
    for (const sec of ["math", "rw"] as Section[]) {
      const ks = TAXONOMY[sec].flatMap((d) => d.skills);
      out[sec] = { total: ks.reduce((a, k) => a + (skills[k]?.total ?? 0), 0), answered: ks.reduce((a, k) => a + (skills[k]?.answered ?? 0), 0) };
    }
    return out;
  }, [skills]);

  const go = (p: Record<string, string>) => {
    const q = new URLSearchParams({ section, status: "all", limit: "20", ...p });
    router.push(`/practice/play?${q}`);
  };

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const selectedCount = [...selected].reduce((a, k) => a + (skills[k]?.total ?? 0), 0);

  return (
    <div className="animate-rise pb-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-tight font-medium tracking-[-0.01em]">Question Bank</h1>
          <p className="mt-1.5 text-[15px] text-muted">Every question is free with a full explanation. Pick a skill and go.</p>
        </div>
      </div>

      {/* Bank selector */}
      <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        {(["math", "rw"] as Section[]).map((sec) => {
          const on = section === sec;
          const t = sectionTotals[sec];
          return (
            <button
              key={sec}
              onClick={() => { setSection(sec); setSelected(new Set()); router.replace(`/practice?section=${sec}`, { scroll: false }); }}
              aria-pressed={on}
              className={`group relative overflow-hidden rounded-2xl border-2 bg-white p-4 text-left transition-all sm:p-6 ${on ? "border-red shadow-card" : "border-line opacity-75 hover:opacity-100 md:scale-[0.97]"}`}
            >
              <SubjectArt kind={sec} className={`pointer-events-none absolute -right-8 -top-10 h-64 w-64 ${sec === "math" ? "text-red" : "text-gold"} opacity-60`} />
              <div className="relative">
                <p className={`eyebrow ${sec === "math" ? "text-red" : "text-gold-600"}`}>{sec === "math" ? "Math" : "English"}</p>
                <p className="mt-1 text-[20px] font-medium sm:text-[24px]">ScholarSAT {SECTION_LABEL[sec]} Bank</p>
                <p className="mt-1 hidden text-sm text-muted sm:block">{sec === "math" ? "Computed answers and step-by-step solutions for every tested math skill." : "Passages and drills built on every reading and writing question type."}</p>
                <p className="mt-3 flex items-baseline gap-1.5 sm:mt-4">
                  <span className={`text-[28px] font-medium tabular-nums ${sec === "math" ? "text-red" : "text-gold-600"}`}>{t.answered.toLocaleString()}</span>
                  <span className="text-sm text-muted">/ {t.total.toLocaleString()} questions</span>
                </p>
                <Progress value={t.total ? t.answered / t.total : 0} tone={sec === "math" ? "red" : "gold"} className="mt-2 h-2" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Domains */}
      <div className="mt-6 grid gap-6">
        {TAXONOMY[section].map((d) => {
          const total = d.skills.reduce((a, k) => a + (skills[k]?.total ?? 0), 0);
          const answered = d.skills.reduce((a, k) => a + (skills[k]?.answered ?? 0), 0);
          const sectionTotal = sectionTotals[section].total;
          const allOn = d.skills.every((k) => selected.has(k));
          return (
            <section key={d.domain} className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { const n = new Set(selected); d.skills.forEach((k) => (allOn ? n.delete(k) : n.add(k))); setSelected(n); }}
                    aria-pressed={allOn}
                    aria-label={allOn ? `Deselect all ${d.domain} skills` : `Select all ${d.domain} skills`}
                    className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${allOn ? "border-red bg-red text-white" : "border-line bg-surface text-faint hover:text-ink"}`}
                  >
                    {allOn ? <ICheck className="h-4 w-4" /> : <span className="h-0.5 w-3 rounded bg-current" />}
                  </button>
                  <div>
                    <h2 className="text-[22px] leading-tight font-medium">{d.domain}</h2>
                    <p className="text-sm text-muted">{Math.round((total / sectionTotal) * 100)}% of the {SECTION_LABEL[section]} bank</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red px-3 py-1 text-[13px] font-medium text-white tabular-nums">{answered}/{total}</span>
                  <Button size="sm" variant="secondary" onClick={() => go({ domain: d.domain })}>Practice domain</Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {d.skills.map((k) => {
                  const s = skills[k] ?? { total: 0, answered: 0, correct: 0, wrong: 0, byDiff: { E: 0, M: 0, H: 0 } };
                  const on = selected.has(k);
                  return (
                    <div key={k} className={`group relative flex overflow-hidden rounded-xl border transition-colors ${on ? "border-red ring-1 ring-red" : "border-line hover:border-line-strong"}`}>
                      <button type="button" onClick={() => setSelected(toggle(selected, k))} aria-pressed={on} className="relative flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 text-left">
                        <SubjectArt kind={section} className={`pointer-events-none absolute -right-12 -top-6 h-40 w-40 ${section === "math" ? "text-red" : "text-gold"} opacity-25`} />
                        <div className="relative flex items-start gap-2.5">
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${on ? "border-red bg-red text-white" : "border-line-strong bg-white"}`}>{on && <ICheck className="h-3.5 w-3.5" />}</span>
                          <span className="text-[15px] leading-snug font-medium">{k}</span>
                        </div>
                        <span className="relative text-[13px] text-muted">{s.total} questions · {s.byDiff.E}/{s.byDiff.M}/{s.byDiff.H} E/M/H</span>
                      </button>
                      <div className="flex w-[124px] shrink-0 flex-col items-center gap-2 border-l border-line bg-surface/60 p-3">
                        <Ring value={s.answered ? s.correct / s.answered : null} size={52} stroke={5} tone={s.answered && s.correct / s.answered >= 0.7 ? "ok" : "red"} />
                        <div className="flex items-center gap-2 text-xs font-medium tabular-nums">
                          <span className="flex items-center gap-0.5 text-ok-500"><ICheckCircle className="h-3.5 w-3.5" />{s.correct}</span>
                          <span className="flex items-center gap-0.5 text-bad"><IXCircle className="h-3.5 w-3.5" />{s.wrong}</span>
                        </div>
                        <span className="text-xs tabular-nums text-muted"><span className="font-medium text-red">{s.answered}</span>/{s.total}</span>
                        <Button size="sm" className="w-full gap-1 px-2 text-[11px] tracking-[0.06em] uppercase" onClick={() => go({ skill: k })}>
                          <IPlay className="h-3.5 w-3.5" /> Practice
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:left-[256px]">
          <div className="flex w-full max-w-xl animate-rise items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-3 shadow-pop">
            <p className="text-sm"><span className="font-medium">{selected.size} skill{selected.size === 1 ? "" : "s"}</span> <span className="text-muted">· {selectedCount.toLocaleString()} questions</span></p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              <Button onClick={() => go({ skills: [...selected].join("|") })} disabled={!selectedCount}>Practice selected</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
