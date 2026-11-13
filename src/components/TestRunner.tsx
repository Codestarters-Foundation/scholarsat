"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import { Choices, Passage, SprInput } from "./QuestionBody";
import { MathTools } from "./MathTools";
import { Rich } from "./Rich";
import { Button } from "./ui";
import { IArrowL, IArrowR, IFlag } from "./icons";

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

  if (!v) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;

  const moduleLabel = `${SECTION_LABEL[v.section]} · Module ${(v.current % 2) + 1}`;

  if (!v.started)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">Section {v.current < 2 ? 1 : 2} of 2</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{moduleLabel}</h1>
        <p className="mt-3 text-muted">{v.questions.length} questions · {v.minutes} minutes</p>
        <p className="mt-4 text-sm text-muted">The timer starts when you begin and keeps running if you leave. When time runs out, the module submits automatically.</p>
        <Button className="mt-6" onClick={async () => apply(await post({ action: "start" }))}>Begin module</Button>
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

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface">
      <header className="z-20 flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-sm font-semibold">{moduleLabel}</p>
        <div className="flex items-center gap-2">
          {!hideTimer && <span className={`rounded-lg px-3 py-1 font-mono text-lg font-semibold tabular-nums ${left < 5 * 60000 ? "bg-red-50 text-red" : "text-ink"}`} role="timer" aria-live={left < 60000 ? "polite" : "off"}>{mm}:{String(ss).padStart(2, "0")}</span>}
          <button onClick={() => setHideTimer((h) => !h)} className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-surface">{hideTimer ? "Show timer" : "Hide"}</button>
        </div>
        <button onClick={() => setConfirm(true)} className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-red/40">Submit module</button>
      </header>

      <div className={`mx-auto grid w-full max-w-6xl flex-1 content-start gap-5 overflow-auto px-4 py-6 sm:px-6 ${split ? "lg:grid-cols-2" : ""}`}>
        {split && <section className="rounded-2xl border border-line bg-white p-6" aria-label="Passage"><Passage q={q} /></section>}
        <section className={`rounded-2xl border border-line bg-white p-6 ${split ? "" : "mx-auto w-full max-w-3xl"}`}>
          <div className="mb-4 flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-semibold text-white">{i + 1}</span>
            <button onClick={async () => setV(await post({ action: "flag", qid: q.id }))} aria-pressed={flagged} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${flagged ? "bg-gold-50 text-gold-600" : "text-muted hover:bg-surface"}`}>
              <IFlag className="h-4 w-4" /> {flagged ? "Marked for review" : "Mark for review"}
            </button>
          </div>
          {v.section === "math" && <div className="mb-4"><MathTools /></div>}
          <Rich text={q.stem} className="mb-5 text-[1.05rem] font-medium" />
          {q.type === "mcq" ? (
            <Choices q={q} selected={answer} onSelect={setAnswer} struck={struck[q.id] ?? new Set()} onStrike={(l) => setStruck((s) => { const n = new Set(s[q.id] ?? []); n.has(l) ? n.delete(l) : n.add(l); return { ...s, [q.id]: n }; })} />
          ) : (
            <SprInput value={answer} onChange={setAnswer} />
          )}
        </section>
      </div>

      <footer className="z-20 border-t border-line bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}><IArrowL className="h-4 w-4" /> Back</Button>
          <button onClick={() => setShowGrid((s) => !s)} aria-expanded={showGrid} className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white">
            Question {i + 1} of {v.questions.length}
          </button>
          {i < v.questions.length - 1 ? (
            <Button onClick={() => setI(i + 1)}>Next <IArrowR className="h-4 w-4" /></Button>
          ) : (
            <Button variant="gold" onClick={() => setConfirm(true)}>Review &amp; submit</Button>
          )}
        </div>
        {showGrid && (
          <div className="mx-auto mt-3 max-w-6xl rounded-xl border border-line bg-white p-4">
            <p className="mb-3 text-sm text-muted">{answeredCount} of {v.questions.length} answered · flags show questions marked for review</p>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-14">
              {v.questions.map((x, k) => (
                <button key={x.id} onClick={() => { setI(k); setShowGrid(false); }} className={`relative h-9 rounded-lg border text-sm font-semibold ${k === i ? "border-ink ring-1 ring-ink" : "border-line"} ${v.answers[x.id] ? "bg-red-50 text-red" : "bg-white text-muted"}`} aria-label={`Question ${k + 1}${v.answers[x.id] ? ", answered" : ""}${v.flags.includes(x.id) ? ", marked for review" : ""}`}>
                  {k + 1}
                  {v.flags.includes(x.id) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="sub-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 id="sub-title" className="font-display text-xl font-semibold">Submit this module?</h2>
            <p className="mt-2 text-sm text-muted">You answered {answeredCount} of {v.questions.length} questions. You can&apos;t come back to this module after submitting.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)}>Keep working</Button>
              <Button onClick={submit}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
