"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicQuestion } from "@/lib/bank";
import { Choices, Passage, SprInput } from "./QuestionBody";
import { Rich } from "./Rich";
import { explainQuestionPrompt, questionHintPrompt } from "@/lib/ai-prompts";
import { Tutor, useTutorConnection } from "./Tutor";
import { Button, DiffBadge } from "./ui";
import { IArrowR } from "./icons";

type Graded = { correct: boolean; answer: string; explanation: string };

export function GuidedQuestion({ q, planFirst = false }: { q: PublicQuestion; planFirst?: boolean }) {
  const { setMode } = useTutorConnection();
  useEffect(()=>{ if(planFirst) setMode("plan"); },[planFirst,setMode]);
  const [response, setResponse] = useState("");
  const [result, setResult] = useState<Graded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const start = useRef(Date.now());
  const help = useRef<HTMLElement>(null);
  async function grade() {
    if (!response || busy || result) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/attempt", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, response, timeMs: Date.now() - start.current }) });
      if (!r.ok) throw new Error();
      setResult(await r.json());
    } catch {
      setError("Could not check your answer. Try again.");
    } finally { setBusy(false); }
  }
  return <div className="guided-spread">
    <section className="exercise-sheet" aria-labelledby="exercise-skill">
      <header><h2 id="exercise-skill">{q.skill}</h2><DiffBadge d={q.difficulty} /></header>
      <a className="exercise-hint-link" href="#question-tutor" onClick={() => {
        const panel = help.current?.querySelector("details");
        if (panel) {
          panel.open = true;
          panel.querySelector<HTMLButtonElement>("button[data-ask]:enabled")?.click();
        }
      }}>{result ? "Explore the explanation" : "Get a hint"} <IArrowR /></a>
      <Passage q={q} /><Rich className="exercise-stem" text={q.stem} />
      {q.type === "mcq"
        ? <Choices q={q} selected={response} onSelect={setResponse} disabled={!!result || busy} reveal={result} />
        : <SprInput value={response} onChange={setResponse} disabled={!!result || busy} reveal={result} />}
      <div className="exercise-foot">{result ? <>
        <div role="status"><strong>{result.correct ? "Correct" : "Review the answer"}</strong><Rich text={result.explanation} /></div>
        <Link className="skill-start" href={`/practice/play?${new URLSearchParams({ section: q.section, skill: q.skill, topic: q.domain, limit: "5" })}`}>Practice this skill <IArrowR /></Link>
      </> : <Button onClick={grade} disabled={!response || busy}>{busy ? "Checking…" : "Check answer"}</Button>}
      {error && <p role="alert">{error}</p>}</div>
    </section>
    <aside ref={help} id="question-tutor" tabIndex={-1} className="guided-margin" aria-label="Question help">
      <Tutor key={result ? "answer" : "hint"} item={q.id} hint={!result} expanded
        providerPrompt={result ? explainQuestionPrompt(q, response, result.answer, result.explanation, result.correct) : questionHintPrompt(q)} />
    </aside>
  </div>;
}
