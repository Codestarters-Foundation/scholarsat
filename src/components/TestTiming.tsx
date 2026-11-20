"use client";

import Link from "next/link";
import type { Section } from "@/lib/types";

export type TestModule = { section: Section; minutes: number; n: number };
export const moduleName = (part: TestModule, i: number) =>
  `${part.section === "rw" ? "Reading & writing" : "Math"} · Module ${i % 2 + 1}`;

export function TestTiming({modules, index, onChange}: {
  modules: TestModule[]; index: number; onChange: (index: number) => void;
}) {
  const part = modules[index];
  return <>
    <h3>Mock tests</h3>
    <div className="module-sequence" role="group" aria-label="Explore a module">
      {modules.map((m,i) => <button type="button" key={i} aria-label={moduleName(m,i)} aria-pressed={index === i}
        onClick={() => onChange(i)}>{String(i + 1).padStart(2,"0")}</button>)}
    </div>
    <div className="module-detail" key={index} aria-live="polite">
      <h4>{moduleName(part,index)}</h4>
      <p>{part.n} questions · {part.minutes} minutes</p>
      <p>{index % 2 ? "Difficulty adapts to your first module." : "Your answers set the difficulty of the next module."}</p>
    </div>
    <Link className="page-foot" href="/tests">Open mock tests <span>↗</span></Link>
  </>;
}
