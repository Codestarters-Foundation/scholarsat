"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TAXONOMY, SECTION_LABEL, type Section, type Difficulty } from "@/lib/types";
import "./practice.css";
import { Button } from "./ui";
import { IArrowR, IBook, ICalc, ICheck, IChevR, ISparkle } from "./icons";

export type SkillInfo = { total: number; fresh: number; byDiff: Record<Difficulty, number>; answered: number; correct: number; wrong: number };

export function PracticeFilters({
  section,
  topic,
  workshop,
  skills,
}: {
  section: Section;
  topic?: string;
  workshop: boolean;
  skills: Record<string, SkillInfo>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState("10");
  const catalog = (section: Section, topic?: string, fresh=workshop) => {
    const params = new URLSearchParams({section});
    if (topic) params.set("topic",topic);
    if (fresh) params.set("collection","skill-workshop");
    return "/practice?" + params;
  };
  const domains = TAXONOMY[section];
  const active = domains.find(group => group.domain === topic) ?? domains[0];
  const count = (names: string[]) => names.reduce((sum, name) => sum + (skills[name]?.total ?? 0), 0);
  const allOn = active.skills.every(skill => selected.has(skill));
  const subjectCount = (s: Section) => count(TAXONOMY[s].flatMap(d => d.skills));

  const go = (p: Record<string, string>) => {
    const q = new URLSearchParams({ section, topic: active.domain, status: "all", limit, ...(workshop ? {collection:"skill-workshop"} : {}), ...p });
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
      <header className="practice-heading">
        <div><h1>Practice</h1><p>{(subjectCount("math")+subjectCount("rw")).toLocaleString("en-US")} questions across {Object.keys(skills).length} skills.</p></div>
        <div className="practice-header-actions"><button className="quick-practice" onClick={()=>go({domain:active.domain})}>Start {limit==="0" ? count(active.skills).toLocaleString("en-US") : limit} questions <IArrowR /></button>
        <Link className="tutor-invite" href="/tutor"><ISparkle /> AI tutor <IArrowR /></Link></div>
      </header>
      <nav className="subject-switch" aria-label="Practice subject">
        {(["math", "rw"] as const).map(sec => <Link key={sec} href={catalog(sec)} scroll={false} aria-current={section === sec ? "page" : undefined}>
          {sec === "math" ? <ICalc /> : <IBook />} <span>{SECTION_LABEL[sec]}</span>
          <small>{subjectCount(sec).toLocaleString("en-US")} questions</small>
        </Link>)}
      </nav>
      <div className="practice-controls">
        <nav aria-label="Question collection" className="collection-switch">
          <Link scroll={false} aria-current={!workshop ? "page" : undefined} href={catalog(section,active.domain,false)}>Full library</Link>
          <Link scroll={false} aria-current={workshop ? "page" : undefined} href={catalog(section,active.domain,true)}>New questions</Link>
        </nav>
        <label className="session-size">Set length <select value={limit} onChange={e=>setLimit(e.target.value)}>
          <option value="10">10 questions</option><option value="20">20 questions</option><option value="0">All questions</option>
        </select></label>
      </div>
      <div className="practice-spread">
        <nav className="topic-index" aria-label="Topics"><h2>Topics</h2>
          <label className="compact-topic">Topic<select value={active.domain} onChange={e=>router.push(catalog(section,e.target.value),{scroll:false})}>
            {domains.map(group=><option key={group.domain}>{group.domain}</option>)}
          </select></label>
          {domains.map(group => <Link key={group.domain} scroll={false} href={catalog(section,group.domain)}
            aria-current={group === active ? "true" : undefined}><span>{group.domain}</span><IChevR /></Link>)}

        </nav>
        <section key={active.domain+workshop} className="skill-domain" id="practice-skills" tabIndex={-1} aria-labelledby="active-topic">
          <header><div><h2 id="active-topic">{active.domain}</h2>
            <p>{active.skills.length} skills · {count(active.skills).toLocaleString("en-US")} questions</p></div>
            <button className="topic-start" onClick={() => go({ domain: active.domain })}>Start topic <IArrowR /></button>
          </header>
          <button className="select-domain" aria-pressed={allOn} onClick={() => {
            const next = new Set(selected);
            active.skills.forEach(skill => allOn ? next.delete(skill) : next.add(skill));
            setSelected(next);
          }}><span className="skill-check" aria-hidden="true">{allOn && <ICheck />}</span>{allOn ? "Deselect all" : "Select all skills"}</button>
          <ul>{active.skills.map(skill => {
            const stats = skills[skill];
            const on = selected.has(skill);
            return <li key={skill}>
              <button className="skill-select" aria-pressed={on} onClick={() => setSelected(toggle(selected, skill))}>
                <span className="skill-check" aria-hidden="true">{on && <ICheck />}</span>
                <span>{skill}<small>{stats?.total ?? 0} questions{!workshop && stats?.fresh ? ` · ${stats.fresh} new` : ""}{stats?.answered ? ` · ${stats.correct} correct, ${stats.wrong} missed` : ""}</small></span>
              </button>
              <button className="skill-start" aria-label={`Practice ${skill}`} onClick={() => go({ skill })}>Practice <IArrowR /></button>
            </li>;
          })}</ul>
          <details className="level-breakdown"><summary>Difficulty breakdown</summary>
            <table><thead><tr><th>Skill</th><th>Easy</th><th>Medium</th><th>Hard</th></tr></thead><tbody>{active.skills.map(name =>
              <tr key={name}><th>{name}</th>{(["E","M","H"] as const).map(d => <td key={d}>{skills[name]?.byDiff[d] ?? 0}</td>)}</tr>)}</tbody></table>
          </details>
        </section>
      </div>
      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:left-[256px]">
          <div className="practice-selection flex w-full max-w-xl items-center justify-between gap-4 rounded-2xl border border-line bg-bg px-5 py-3 shadow-pop">
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
