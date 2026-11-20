"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PracticeSetPicker, practiceSet } from "./PracticeSetPicker";
import { questionBankSession, turnTo } from "./landing-navigation";
import { StudyFolio } from "./StudyFolio";
import { TestTiming, type TestModule } from "./TestTiming";

const stops = [
  { id: "bank", label: "Practice sets" },
  { id: "tests", label: "Mock tests" },
  { id: "tools", label: "Study tools" },
  { id: "enter", label: "Enter ScholarSAT" },
];

export type StudyOptions = {signedIn: boolean; counts: Record<string, number>; total: number; modules: TestModule[]};
export function StudyDesk({ counts, total, modules, signedIn, response, solved }: StudyOptions & {
  response?: string; solved: boolean;
}) {
  const [chosen, setChosen] = useState<ReturnType<typeof practiceSet> | null>(null);
  const set = chosen ?? practiceSet(counts, "rw", "Transitions");
  const [moduleIndex, setModuleIndex] = useState(0);
  const part = modules[moduleIndex];
  const destination = set.n && (chosen || solved) ? set : null;
  const [chapter, setChapter] = useState(0);
  const pages = [
    {
      front: <div className="front-cover">
        <Image unoptimized className="jacket-plate" src="/landing/lunar/apollo-17-station-6.webp" width={880} height={912} alt="" />
        <div className="jacket-title"><span>Digital SAT</span><strong>Practice<br/>Book</strong></div>
        <div className="jacket-colophon">ScholarSAT <Link href="/#bank" onNavigate={event => turnTo("bank",event)} aria-label="Open the practice book">Open book ↗</Link></div>
      </div>,
      back: <figure className="field-plate"><figcaption>Apollo 17 <span>Taurus–Littrow, 1972 · NASA</span></figcaption></figure>,
    },
    {
      front: <section className="press-page" aria-labelledby="sets-title">
        <h3 id="sets-title">Practice sets</h3>
        <PracticeSetPicker counts={counts} set={set} onChoose={setChosen}/>
        <Link className="page-foot" href="/practice">Browse {total.toLocaleString("en-US")} questions <span>↗</span></Link>
      </section>,
      back: <div className="clock-plate" aria-hidden="true"><div className="minute-dial">
        <div className="minute-hand" style={{rotate: `${part.minutes * 6}deg`}}/>
        <strong>{part.minutes}</strong><span>minutes</span></div></div>,
    },
    {
      front: <section className="press-page" aria-label="Mock tests"><TestTiming modules={modules} index={moduleIndex} onChange={setModuleIndex}/></section>,
      back: <figure className="proof-plate"><div aria-hidden="true"/>
        <figcaption><strong>Reading &amp; writing</strong><span>Lunar calendars</span></figcaption>
      </figure>,
    },
    {
      front: <section className="press-page" aria-labelledby="tools-title"><h3 id="tools-title">Study tools</h3>
        {response && <p className="answer-imprint"><span>{solved ? "Correct answer" : "Your answer"}</span> {response}</p>}
        <div className="review-links">{[["Mistake review","/review"],["Skill diagnostics","/diagnostics"],["Vocabulary","/vocab"]].map(([label,href]) =>
          <Link href={href} key={href}>{label}<span aria-hidden="true">↗</span></Link>)}</div>
        <Link className="page-foot" href="/#passage">{response ? (solved ? "Review your answer" : "Retry the passage") : "Try the lunar passage"} <span>↗</span></Link>
      </section>,
      back: <section className="endpaper" aria-label="Enter ScholarSAT">
        <div className="end-orbit" aria-hidden="true"/>
        <div className="end-title"><h3>ScholarSAT</h3>{destination && <p>{destination.selected} · {destination.n} questions</p>}</div>
        <Link className="press-action" href={destination?.href ?? (signedIn ? "/dashboard" : questionBankSession)}>
          {destination ? "Start my set" : signedIn ? "Open my dashboard" : "Open the question bank"} <span>↗</span>
        </Link>
        {destination && <Link className="end-bank" href={questionBankSession}>Open the question bank</Link>}
      </section>,
    },
  ];
  return <section id="book" className="study-desk" aria-label="Inside ScholarSAT">
    <div className="desk-contents">
      <StudyFolio pages={pages} chapter={chapter} onChapter={setChapter}/>
      <nav aria-label="Study options">{stops.map(({id,label},i) =>
        <Link key={id} href={"/#" + id} onNavigate={event => turnTo(id,event)} aria-current={chapter === i+1 ? "page" : undefined}>{label}</Link>)}</nav>
    </div>
    <div className="study-stops" aria-hidden="true">{stops.map(({id}) => <div className="book-stop" id={id} key={id}/>)}</div>
  </section>;
}
