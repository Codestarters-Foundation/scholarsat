"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TAXONOMY, SECTION_LABEL, type Section, type Difficulty } from "@/lib/types";
import "./practice.css";
import { Button } from "./ui";
import { ICheck } from "./icons";

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
    const q = new URLSearchParams({ section, status: "all", limit: "0", ...p }); // limit 0 = every question in the skill or domain
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
    <div className="practice-index pb-24">
      <header>
        <h1>Question bank</h1>
        <p>Choose a skill for focused practice, or select several to build a set.</p>
      </header>
      <div className="bank-subjects" aria-label="Practice subject">
        {(["math", "rw"] as const).map((sec) => (
          <button key={sec} aria-pressed={section === sec} onClick={() => {
            setSection(sec);
            setSelected(new Set());
            router.replace(`/practice?section=${sec}`, { scroll: false });
          }}>
            {SECTION_LABEL[sec]}
            <small>{sectionTotals[sec].answered.toLocaleString()} / {sectionTotals[sec].total.toLocaleString()}</small>
          </button>
        ))}
      </div>
      {TAXONOMY[section].map((domain) => {
        const allOn = domain.skills.every((skill) => selected.has(skill));
        return (
          <section className="skill-domain" key={domain.domain}>
            <header>
              <h2>{domain.domain}</h2>
              <button onClick={() => go({ domain: domain.domain })}>Practice domain ↗</button>
            </header>
            <button className="select-domain" aria-pressed={allOn} onClick={() => {
              const next = new Set(selected);
              domain.skills.forEach(skill => allOn ? next.delete(skill) : next.add(skill));
              setSelected(next);
            }}>{allOn ? "Deselect" : "Select"} all {domain.skills.length} skills</button>
            <ul>
              {domain.skills.map((skill) => {
                const stats = skills[skill];
                const on = selected.has(skill);
                return (
                  <li key={skill}>
                    <button className="skill-select" aria-pressed={on} onClick={() => setSelected(toggle(selected, skill))}>
                      <span className="skill-check" aria-hidden="true">{on && <ICheck />}</span>
                      <span>{skill}<small>{stats?.total ?? 0} questions · {stats?.byDiff.E ?? 0} easy / {stats?.byDiff.M ?? 0} medium / {stats?.byDiff.H ?? 0} hard
                        {!!stats?.answered && ` · ${stats.correct} correct, ${stats.wrong} missed (${Math.round(stats.correct / stats.answered * 100)}%)`}
                      </small></span>
                    </button>
                    <button className="skill-start" aria-label={`Practice ${skill}`} onClick={() => go({ skill })}>Practice ↗</button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:left-[256px]">
          <div className="flex w-full max-w-xl animate-rise items-center justify-between gap-4 rounded-2xl border border-line bg-bg px-5 py-3 shadow-pop">
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
