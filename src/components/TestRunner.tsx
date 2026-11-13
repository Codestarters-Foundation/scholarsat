"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import { Choices, Passage, SprInput } from "./QuestionBody";
import { DESMOS_URL, ReferenceSheet, ToolButton } from "./MathTools";
import { Owl } from "./Owl";
import { Rich } from "./Rich";
import { Button } from "./ui";
import { IArrowL, IArrowR, IBookmark, ICalc, IChevD, IClock, IFormula, IStrike } from "./icons";

type PQ = Omit<Question, "answer" | "explanation">;
type View = { finished: boolean; current: number; section: "rw" | "math"; minutes: number; started: boolean; remainingMs: number; questions: PQ[]; answers: Record<string, string>; flags: string[] };

export function TestRunner({ id }: { id: number }) {
  const router = useRouter();
  const [v, setV] = useState<View | null>(null);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [strikeMode, setStrikeMode] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [struck, setStruck] = useState<Record<string, Set<string>>>({});
  const deadline = useRef(0);
  const submitting = useRef(false);

  const post = useCallback(async (body: object) => {
    const r = await fetch(`/api/tests/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return (await r.json()) as View;
  }, [id]);

  const apply = (nv: View) => {
    setV(nv);
    deadline.current = Date.now() + nv.remainingMs;
    setLeft(nv.remainingMs);
  };

  useEffect(() => {
    fetch(`/api/tests/${id}`).then((r) => r.json()).then(apply);
  }, [id]);

  const submit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setConfirm(false);
    const nv = await post({ action: "submit" });
    submitting.current = false;
    if (nv.finished) {
      router.push(`/tests/${id}/report`);
      return;
    }
    setI(0);
    apply(nv);
  }, [post, router, id]);

  useEffect(() => {
    if (!v?.started) return;
    const t = setInterval(() => {
      const l = Math.max(0, deadline.current - Date.now());
      setLeft(l);
      if (l === 0) submit();
    }, 500);
    return () => clearInterval(t);
  }, [v?.started, v?.current, submit]);

  if (!v) return <div className="grid h-96 place-items-center"><Owl size={72} mood="loading" title="Loading test" /></div>;

  const moduleLabel = `${SECTION_LABEL[v.section]} · Module ${(v.current % 2) + 1}`;

  if (!v.started)
    return (
      <div className="mx-auto max-w-xl animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="border-t-4 border-red-700 bg-red px-8 py-6 text-white">
          <p className="eyebrow text-white/80">Section {v.current < 2 ? 1 : 2} of 2 · Module {(v.current % 2) + 1} of 2</p>
          <h1 className="mt-1 text-[26px] font-medium">{SECTION_LABEL[v.section]}</h1>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface p-4"><p className="text-[28px] leading-none font-medium tabular-nums">{v.questions.length}</p><p className="mt-1 text-sm text-muted">questions</p></div>
            <div className="rounded-xl bg-surface p-4"><p className="text-[28px] leading-none font-medium tabular-nums">{v.minutes}</p><p className="mt-1 text-sm text-muted">minutes</p></div>
          </div>
          <p className="mt-5 text-sm text-muted">The timer starts when you begin and keeps running if you leave. When time runs out, the module submits automatically.</p>
          <Button size="lg" className="mt-6 w-full" onClick={async () => apply(await post({ action: "start" }))}>Begin module <IArrowR className="h-4 w-4" /></Button>
        </div>
      </div>
    );

  const q = v.questions[i];
  const answer = v.answers[q.id] ?? "";
  const setAnswer = async (val: string) => {
    setV({ ...v, answers: { ...v.answers, [q.id]: val } });
    await post({ action: "answer", qid: q.id, value: val });
  };
  const flagged = v.flags.includes(q.id);
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  const answeredCount = v.questions.filter((x) => v.answers[x.id]).length;
  const split = !!(q.passage || q.table);
  const lowTime = left < 5 * 60000;

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white">
      <header className="grid h-[68px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b-4 border-red-700 bg-red px-4 text-white sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">{moduleLabel}</p>
          <p className="text-xs text-white/75">{answeredCount} of {v.questions.length} answered</p>
        </div>
        <div className="flex flex-col items-center">
          {!hideTimer ? (
            <span className={`rounded-lg px-2 font-mono text-[22px] leading-tight tabular-nums ${lowTime ? "bg-white text-red" : ""}`} role="timer" aria-live={left < 60000 ? "polite" : "off"}>{mm}:{String(ss).padStart(2, "0")}</span>
          ) : (
            <IClock className="h-6 w-6" />
          )}
          <button onClick={() => setHideTimer((h) => !h)} className="rounded-full border border-white/40 px-2.5 text-[11px] hover:bg-white/10">{hideTimer ? "Show" : "Hide"}</button>
        </div>
        <div className="flex items-center justify-end gap-0.5">
          {q.type === "mcq" && <ToolButton icon={<IStrike className="h-5 w-5" />} label="Eliminate" onClick={() => setStrikeMode((s) => !s)} active={strikeMode} />}
          {v.section === "math" && (
            <>
              <ToolButton icon={<IFormula className="h-5 w-5" />} label="Reference" onClick={() => setRefOpen((o) => !o)} active={refOpen} />
              <ToolButton icon={<ICalc className="h-5 w-5" />} label="Calculator" href={DESMOS_URL} />
            </>
          )}
        </div>
      </header>
      <div className="eyebrow shrink-0 bg-ink py-1 text-center text-white/90">ScholarSAT practice test</div>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {split && (
          <section className="scroll-thin border-b border-line px-6 py-7 lg:w-1/2 lg:overflow-y-auto lg:border-b-0 lg:border-r-4 lg:border-r-surface-2 lg:px-9 lg:py-9" aria-label="Passage">
            <Passage q={q} />
          </section>
        )}
        <section className={`scroll-thin px-6 py-7 lg:overflow-y-auto lg:px-9 lg:py-9 ${split ? "lg:w-1/2" : "mx-auto w-full max-w-3xl"}`} aria-label="Question">
          <div className="mb-5 flex items-center gap-3 border-b border-line bg-surface pr-2">
            <span className="grid h-11 w-11 place-items-center bg-ink text-[17px] font-medium text-white tabular-nums">{i + 1}</span>
            <button onClick={async () => setV(await post({ action: "flag", qid: q.id }))} aria-pressed={flagged} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm ${flagged ? "font-medium text-red" : "text-ink-2 hover:bg-surface-2"}`}>
              <IBookmark filled={flagged} className="h-4 w-4" /> Mark for review
            </button>
          </div>
          <Rich text={q.stem} className="mb-5 text-[17px] text-ink" />
          {q.type === "mcq" ? (
            <Choices q={q} selected={answer} onSelect={setAnswer} struck={struck[q.id] ?? new Set()} onStrike={strikeMode ? (l) => setStruck((s) => { const n = new Set(s[q.id] ?? []); n.has(l) ? n.delete(l) : n.add(l); return { ...s, [q.id]: n }; }) : undefined} />
          ) : (
            <SprInput value={answer} onChange={setAnswer} />
          )}
        </section>
      </div>

      <footer className="relative shrink-0 border-t border-line bg-white px-4 py-3 sm:px-6">
        {showGrid && (
          <div className="absolute bottom-full left-1/2 mb-3 w-[min(94vw,640px)] -translate-x-1/2 animate-rise rounded-2xl border border-line bg-white p-5 shadow-pop">
            <p className="text-center font-medium">{moduleLabel}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-4 border-b border-line pb-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-ink/40" /> Unanswered</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red" /> Answered</span>
              <span className="flex items-center gap-1.5"><IBookmark filled className="h-3 w-3 text-gold" /> For review</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10">
              {v.questions.map((x, k) => (
                <button key={x.id} onClick={() => { setI(k); setShowGrid(false); }} className={`relative h-10 rounded-lg text-sm font-medium tabular-nums ${v.answers[x.id] ? "bg-red text-white" : "border border-dashed border-ink/40 text-ink"} ${k === i ? "ring-2 ring-ink ring-offset-2" : ""}`} aria-label={`Question ${k + 1}${v.answers[x.id] ? ", answered" : ""}${v.flags.includes(x.id) ? ", marked for review" : ""}`}>
                  {k + 1}
                  {v.flags.includes(x.id) && <IBookmark filled className="absolute -right-1 -top-1.5 h-3.5 w-3.5 text-gold" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center"><Button variant="secondary" size="sm" onClick={() => { setShowGrid(false); setConfirm(true); }}>Go to submit</Button></div>
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setConfirm(true)}>Submit module</Button>
          <button onClick={() => setShowGrid((s) => !s)} aria-expanded={showGrid} className="btn-3d inline-flex items-center gap-2 rounded-xl border-b-black bg-ink px-4 py-2 text-sm font-medium text-white">
            Question {i + 1} of {v.questions.length} <IChevD className={`h-4 w-4 transition-transform ${showGrid ? "" : "rotate-180"}`} />
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}><IArrowL className="h-4 w-4" /> Back</Button>
            {i < v.questions.length - 1 ? (
              <Button onClick={() => setI(i + 1)}>Next <IArrowR className="h-4 w-4" /></Button>
            ) : (
              <Button variant="gold" onClick={() => setConfirm(true)}>Review &amp; submit</Button>
            )}
          </div>
        </div>
      </footer>

      {refOpen && <ReferenceSheet onClose={() => setRefOpen(false)} />}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="sub-title">
          <div className="w-full max-w-md animate-rise overflow-hidden rounded-2xl bg-white shadow-pop">
            <div className="border-t-4 border-red-700 bg-red px-6 py-4 text-white"><h2 id="sub-title" className="text-[18px] font-medium">Submit this module?</h2></div>
            <div className="p-6">
              <p className="text-sm text-muted">You answered <span className="font-medium text-ink">{answeredCount} of {v.questions.length}</span> questions{v.flags.length ? ` and marked ${v.flags.length} for review` : ""}. You can&apos;t come back to this module after submitting.</p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setConfirm(false)}>Keep working</Button>
                <Button onClick={submit}>Submit module</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
