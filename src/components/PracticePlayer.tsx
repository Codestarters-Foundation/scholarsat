"use client";
import "./practice.css";
import { questionHintPrompt } from "@/lib/ai-prompts";
import { Tutor } from "./Tutor";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Difficulty, Question } from "@/lib/types";
import { Choices, Passage, SprInput } from "./QuestionBody";
import { DESMOS_URL, ReferenceSheet, ToolButton } from "./MathTools";
import { Rich } from "./Rich";
import { Logo } from "./Logo";
import { Owl } from "./Owl";
import { TeachButton } from "./tutor/TeachButton";
import { setTutorOpen } from "@/lib/tutor-store";
import { TutorTray } from "./tutor/TutorTray";
import { Button, DiffBadge, EmptyState, LinkButton } from "./ui";
import { IArrowL, IArrowR, IBookmark, ICalc, ICheckCircle, IFormula, IList, IStrike, IX, IXCircle } from "./icons";

type PQ = Omit<Question, "answer" | "explanation">;
type Result = { correct: boolean; answer: string; explanation: string; saved: boolean; dist?: Record<string, number> };
type Item = { id: string; difficulty: Difficulty };

export function PracticePlayer({ items, signedIn, title, backHref = "/practice" }: { items: Item[]; signedIn: boolean; title: string; backHref?: string }) {
  const [idx, setIdx] = useState(0);
  const [q, setQ] = useState<PQ | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [resp, setResp] = useState("");
  const [struck, setStruck] = useState<Set<string>>(new Set());
  const [strikeMode, setStrikeMode] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [listPage, setListPage] = useState(0);
  const pageSize = 24;
  const [listOpen, setListOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());
  const graded = useRef(new Map<string,{result:Result;response:string;elapsed:number}>());
  const activeId = useRef("");
  const [loadError,setLoadError] = useState("");
  const [retry,setRetry] = useState(0);
  const n = items.length;

  const load = useCallback(async (i:number, signal:AbortSignal) => {
    const id = items[i].id;
    activeId.current = id;
    const saved = graded.current.get(id);
    setQ(null); setLoadError(""); setBusy(false);
    setResult(saved?.result ?? null); setResp(saved?.response ?? ""); setStruck(new Set());
    try {
      const response = await fetch(`/api/q/${id}`,{signal});
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (signal.aborted) return;
      setQ(data.question); setBookmarked(data.bookmarked);
      start.current = Date.now() - (saved?.elapsed ?? 0);
      setElapsed(saved?.elapsed ?? 0);
    } catch { if (!signal.aborted) setLoadError("Could not load this question."); }
  },[items]);

  useEffect(() => {
    const controller = new AbortController();
    if(n) void load(idx,controller.signal);
    return () => { controller.abort(); setTutorOpen(null); };
  },[idx,n,load,retry]);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setElapsed(Date.now() - start.current), 1000);
    return () => clearInterval(t);
  }, [q, result]);

  const check = async () => {
    if (!q || !resp || busy || result) return;
    setBusy(true);
    const timeMs = Date.now()-start.current;
    try {
      const request = await fetch("/api/attempt", { method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:q.id,response:resp,timeMs}) });
      if (!request.ok) throw new Error();
      const r:Result = await request.json();
      graded.current.set(q.id,{result:r,response:resp,elapsed:timeMs});
      setOutcomes(o=>({...o,[idx]:r.correct}));
      if (activeId.current===q.id) { setResult(r); setElapsed(timeMs); setLoadError(""); }
    } catch { if(activeId.current===q.id) setLoadError("Could not check this answer. Try again."); }
    finally { if(activeId.current===q.id) setBusy(false); }
  };

  const toggleBookmark = async () => {
    if (!q) return;
    const r = await fetch("/api/bookmark", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: q.id }) });
    if (r.ok) setBookmarked((await r.json()).bookmarked);
  };

  const go = (i: number) => {
    if (i < 0 || i >= n || busy) return;
    setIdx(i);
    setListPage(Math.floor(i / pageSize));
    setListOpen(false);
  };
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || e.defaultPrevented || (e.target instanceof Element && e.target.closest("button, a, summary, textarea"))) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT") {
        if (e.key === "Enter") {
          if (result) next();
          else check();
        }
        return;
      }
      if ((e.target as HTMLElement)?.tagName === "SELECT" || !q) return;
      if (!result && q.type === "mcq" && ["a", "b", "c", "d", "1", "2", "3", "4"].includes(e.key.toLowerCase())) {
        const map: Record<string, string> = { a: "A", b: "B", c: "C", d: "D", "1": "A", "2": "B", "3": "C", "4": "D" };
        setResp(map[e.key.toLowerCase()]);
      } else if (e.key === "Enter") {
        if (result) next();
        else check();
      }
      else if (e.key === "ArrowRight" && result) next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!n)
    return (
      <div className="border-y border-line bg-bg">
        <EmptyState icon={<IList />} title="No questions match these filters." action={<LinkButton href={backHref}>Change filters</LinkButton>}>
          Try more difficulties, a different skill, or &ldquo;All questions&rdquo;.
        </EmptyState>
      </div>
    );

  const mm = Math.floor(elapsed / 60000), ss = Math.floor((elapsed % 60000) / 1000);
  const split = !!(q && (q.passage || q.table));
  const done = Object.keys(outcomes).length;
  const right = Object.values(outcomes).filter(Boolean).length;

  const list = (
    <ul className="grid gap-1 p-3">
      {items.slice(listPage*pageSize,(listPage+1)*pageSize).map((it, offset) => {
        const i = listPage*pageSize+offset;
        const o = outcomes[i];
        const active = i === idx;
        return (
          <li key={it.id}>
            <button onClick={() => go(i)} disabled={busy} aria-current={active ? "true" : undefined} className={`flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors ${active ? "border-red-200 bg-red-50" : "border-transparent hover:bg-surface-2"}`}>
              <span className={`w-9 text-[15px] tabular-nums ${active ? "font-medium text-red" : "text-ink-2"}`}>Q{i + 1}</span>
              <DiffBadge d={it.difficulty} />
              <span className="ml-auto">
                {o === true && <ICheckCircle className="h-4 w-4 text-ok-500" />}
                {o === false && <IXCircle className="h-4 w-4 text-bad" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="practice-player fixed inset-0 z-40 flex bg-bg">
      {/* Question list */}
      <aside className={`${listOpen ? "fixed inset-y-0 left-0 z-50 flex shadow-pop" : "hidden"} w-[256px] shrink-0 flex-col border-r border-line bg-bg lg:static lg:flex lg:shadow-none`}>
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <Logo href="/dashboard" size={36} />
          <button className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden" onClick={() => setListOpen(false)} aria-label="Close question list"><IX className="h-4 w-4" /></button>
        </div>
        <div className="px-5 pt-4">
          <p className="text-[17px] font-medium">Progress</p>
          <div className="mt-2 py-2.5">
            <p className="text-sm text-ink-2"><span className="tabular-nums">{done}</span> of <span className="tabular-nums">{n}</span> questions{done > 0 && <span className="text-muted"> · {right} correct</span>}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-strong"><div className="h-full rounded-full bg-red transition-[width] duration-500" style={{ width: `${(done / n) * 100}%` }} /></div>
          </div>
        </div>
        <nav className="scroll-thin mt-3 flex-1 overflow-y-auto border-t border-line" aria-label="Questions">{list}</nav>
        {n > pageSize && <div className="question-pages"><button aria-label="Previous page of questions" disabled={!listPage} onClick={()=>setListPage(listPage-1)}><IArrowL /></button><span aria-live="polite">{listPage*pageSize+1}–{Math.min((listPage+1)*pageSize,n)} of {n}</span><button aria-label="Next page of questions" disabled={(listPage+1)*pageSize>=n} onClick={()=>setListPage(listPage+1)}><IArrowR /></button></div>}
        <div className="border-t border-line p-3">
          <LinkButton href={backHref} className="w-full text-[13px] tracking-[0.08em] uppercase">Exit practice</LinkButton>
        </div>
      </aside>
      {listOpen && <div className="fixed inset-0 z-40 bg-inverse/30 lg:hidden" onClick={() => setListOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-[60px] shrink-0 items-center gap-2 border-b-4 border-red-700 bg-accent-fill px-2 text-white sm:h-[68px] sm:gap-3 sm:px-5">
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setListOpen(true)} aria-label="Show question list"><IList /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">{title}</p>
            <p className="text-xs text-white/75">Question {idx + 1} of {n}</p>
          </div>
          <span className="font-mono text-[16px] tabular-nums sm:text-[20px]" aria-label="Time on this question">{mm}:{String(ss).padStart(2, "0")}</span>
          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:flex-1">
            {signedIn && <ToolButton icon={<IBookmark filled={bookmarked} className="h-5 w-5" />} label={bookmarked ? "Saved" : "Save"} onClick={toggleBookmark} active={bookmarked} />}
            {q?.type === "mcq" && <ToolButton icon={<IStrike className="h-5 w-5" />} label="Eliminate" onClick={() => setStrikeMode((s) => !s)} active={strikeMode} />}
            {q?.section === "math" && (
              <>
                <ToolButton icon={<IFormula className="h-5 w-5" />} label="Reference" onClick={() => setRefOpen((o) => !o)} active={refOpen} />
                <ToolButton icon={<ICalc className="h-5 w-5" />} label="Calculator" href={DESMOS_URL} />
              </>
            )}
          </div>
        </header>
        <div className="sr-only">ScholarSAT practice</div>

        {/* Body */}
        {!q ? (
          <div className="flex flex-1 items-center justify-center">{loadError ? <div role="alert"><p>{loadError}</p><Button onClick={()=>setRetry(x=>x+1)}>Try again</Button></div> : <Owl size={72} mood="loading" title="Loading question" />}</div>
        ) : (
          <div key={q.id} className="question-leaf scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            <section className="scroll-thin border-b border-line px-6 py-7 lg:w-1/2 lg:overflow-y-auto lg:border-b-0 lg:border-r-4 lg:border-r-surface-2 lg:px-9 lg:py-9" aria-label={split ? "Passage" : "Question"}>
              <div className="mx-auto w-full max-w-[720px]">{split ? <Passage q={q} /> : <Rich text={q.stem} className="text-[18px] text-ink" />}</div>
            </section>
            <section className="scroll-thin px-6 py-7 lg:w-1/2 lg:overflow-y-auto lg:px-9 lg:py-9" aria-label="Answer">
              <div className="mb-5 flex items-center gap-3 border-b border-line bg-surface pr-3">
                <span className="grid h-11 w-11 place-items-center bg-inverse text-[17px] font-medium text-white tabular-nums">{idx + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted">{q.skill}</span>
                <DiffBadge d={q.difficulty} />
              </div>
              {split && <Rich text={q.stem} className="mb-5 text-[17px] text-ink" />}
              {q.type === "mcq" ? (
                <Choices
                  q={q}
                  selected={resp}
                  onSelect={setResp}
                  struck={struck}
                  onStrike={
                    strikeMode
                      ? (l) =>
                          setStruck((s) => {
                            const x = new Set(s);
                            if (x.has(l)) x.delete(l);
                            else x.add(l);
                            return x;
                          })
                      : undefined
                  }
                  reveal={result ? { answer: result.answer, dist: result.dist } : null}
                  disabled={!!result || busy}
                />
              ) : (
                <SprInput value={resp} onChange={setResp} disabled={!!result || busy} reveal={result ? { answer: result.answer, correct: result.correct } : null} />
              )}

              {!result && <Tutor key={q.id + "-hint"} item={q.id} hint providerPrompt={questionHintPrompt(q)} />}
              {result && (
                <div className={`mt-6 animate-rise border-t-2 py-5 ${result.correct ? "border-ok-500" : "border-bad"}`} role="status">
                  <div className="flex items-center gap-3">
                    <Owl key={`${idx}-${result.correct}`} size={44} mood={result.correct ? "celebrate" : "sad"} />
                    <p className={`text-[17px] font-medium ${result.correct ? "text-ok" : "text-bad"}`}>
                      {result.correct ? "Correct! Nice work." : `Not quite. The answer is ${result.answer}.`}
                    </p>
                  </div>
                  <div className="mt-3 text-[15px] text-ink"><Rich text={result.explanation} /></div>
                  <div className="mt-4">
                    <TeachButton qid={q.id} correct={result.correct} saved={result.saved} />
                  </div>
                  {!result.saved && (
                    <p className="mt-3 text-xs text-muted">
                      <Link href="/signup" className="font-medium text-red hover:underline">Create a free account</Link> to save progress and track weak spots.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {q && result && <TutorTray key={q.id} q={q} response={resp} answer={result.answer} explanation={result.explanation} correct={result.correct} />}
        {q && loadError && <p role="alert" className="px-5 text-bad">{loadError}</p>}
        {/* Bottom bar */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <p className="hidden text-xs text-muted md:block">A–D to choose · Enter to check · ← → to move</p>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" onClick={prev} disabled={idx === 0}><IArrowL className="h-4 w-4" /> Back</Button>
            {result ? (
              idx < n - 1 ? (
                <Button onClick={next}>Next <IArrowR className="h-4 w-4" /></Button>
              ) : (
                <LinkButton href={backHref} variant="success">Finish set</LinkButton>
              )
            ) : (
              <Button variant="success" onClick={check} disabled={!resp || busy || !q}>{busy ? "Checking…" : "Check"}</Button>
            )}
          </div>
        </footer>
      </div>

      {refOpen && <ReferenceSheet onClose={() => setRefOpen(false)} />}
    </div>
  );
}
