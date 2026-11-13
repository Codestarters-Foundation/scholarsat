"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/types";
import { DIFFICULTY_LABEL } from "@/lib/types";
import { Choices, Passage, SprInput } from "./QuestionBody";
import { MathTools } from "./MathTools";
import { Rich } from "./Rich";
import { Badge, Button, DIFF_TONE } from "./ui";
import { IArrowL, IArrowR, IBookmark, ICheck, IX } from "./icons";

type PQ = Omit<Question, "answer" | "explanation">;
type Result = { correct: boolean; answer: string; explanation: string; saved: boolean };

export function PracticePlayer({ ids, signedIn, title, backHref = "/practice" }: { ids: string[]; signedIn: boolean; title: string; backHref?: string }) {
  const [idx, setIdx] = useState(0);
  const [q, setQ] = useState<PQ | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [resp, setResp] = useState("");
  const [struck, setStruck] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState({ right: 0, done: 0 });
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());

  const load = useCallback(async (i: number) => {
    setQ(null);
    setResult(null);
    setResp("");
    setStruck(new Set());
    const r = await fetch(`/api/q/${ids[i]}`).then((x) => x.json());
    setQ(r.question);
    setBookmarked(r.bookmarked);
    start.current = Date.now();
    setElapsed(0);
  }, [ids]);

  useEffect(() => {
    if (ids.length) load(idx);
  }, [idx, ids, load]);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setElapsed(Date.now() - start.current), 1000);
    return () => clearInterval(t);
  }, [q, result]);

  const check = async () => {
    if (!q || !resp || busy) return;
    setBusy(true);
    const r: Result = await fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: q.id, response: resp, timeMs: Date.now() - start.current }) }).then((x) => x.json());
    setResult(r);
    setScore((s) => ({ right: s.right + (r.correct ? 1 : 0), done: s.done + 1 }));
    setBusy(false);
  };

  const toggleBookmark = async () => {
    if (!q) return;
    const r = await fetch("/api/bookmark", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: q.id }) });
    if (r.ok) setBookmarked((await r.json()).bookmarked);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") {
        if (e.key === "Enter") (result ? next() : check());
        return;
      }
      if (!q) return;
      if (!result && q.type === "mcq" && ["a", "b", "c", "d", "1", "2", "3", "4"].includes(e.key.toLowerCase())) {
        const map: Record<string, string> = { a: "A", b: "B", c: "C", d: "D", "1": "A", "2": "B", "3": "C", "4": "D" };
        setResp(map[e.key.toLowerCase()]);
      } else if (e.key === "Enter") result ? next() : check();
      else if (e.key === "ArrowRight" && result) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const next = () => idx < ids.length - 1 && setIdx(idx + 1);
  const prev = () => idx > 0 && setIdx(idx - 1);

  if (!ids.length)
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="font-display text-xl font-semibold">No questions match these filters.</p>
        <Link href={backHref} className="mt-4 inline-block font-semibold text-red hover:underline">Change filters</Link>
      </div>
    );

  const mm = Math.floor(elapsed / 60000), ss = Math.floor((elapsed % 60000) / 1000);
  const split = !!(q && (q.passage || q.table));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink" aria-label="Back to filters"><IArrowL /></Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">{title}</p>
            <p className="text-sm text-muted">Question {idx + 1} of {ids.length}{score.done > 0 && <> · {score.right}/{score.done} correct this session</>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white px-2.5 py-1 text-sm tabular-nums text-muted" aria-label="Time on question">{mm}:{String(ss).padStart(2, "0")}</span>
          {signedIn && (
            <button onClick={toggleBookmark} className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium ${bookmarked ? "border-gold bg-gold-50 text-gold-600" : "border-line bg-white text-muted hover:text-ink"}`} aria-pressed={bookmarked}>
              <span className="inline-flex items-center gap-1.5"><IBookmark filled={bookmarked} className="h-4 w-4" /> {bookmarked ? "Saved" : "Save"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white"><div className="h-full bg-red transition-all" style={{ width: `${((idx + (result ? 1 : 0)) / ids.length) * 100}%` }} /></div>

      {!q ? (
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-white" />
      ) : (
        <div className={`mt-6 grid gap-6 ${split ? "lg:grid-cols-2" : ""}`}>
          {split && (
            <section className="rounded-2xl border border-line bg-white p-6 lg:max-h-[calc(100dvh-14rem)] lg:overflow-auto" aria-label="Passage">
              <Passage q={q} />
            </section>
          )}
          <section className={`rounded-2xl border border-line bg-white p-6 ${split ? "" : "mx-auto w-full max-w-3xl"}`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={DIFF_TONE[q.difficulty]}>{DIFFICULTY_LABEL[q.difficulty]}</Badge>
              <Badge>{q.skill}</Badge>
            </div>
            {q.section === "math" && <div className="mb-4"><MathTools /></div>}
            <Rich text={q.stem} className="mb-5 text-[1.05rem] font-medium" />
            {q.type === "mcq" ? (
              <Choices
                q={q}
                selected={resp}
                onSelect={setResp}
                struck={struck}
                onStrike={(l) => setStruck((s) => { const n = new Set(s); n.has(l) ? n.delete(l) : n.add(l); return n; })}
                reveal={result ? { answer: result.answer } : null}
                disabled={!!result}
              />
            ) : (
              <SprInput value={resp} onChange={setResp} disabled={!!result} reveal={result ? { answer: result.answer, correct: result.correct } : null} />
            )}

            {result && (
              <div className={`mt-6 rounded-xl border p-4 ${result.correct ? "border-ok/30 bg-ok-50" : "border-bad/30 bg-bad-50"}`} role="status">
                <p className={`flex items-center gap-2 font-semibold ${result.correct ? "text-ok" : "text-bad"}`}>
                  {result.correct ? <ICheck /> : <IX />} {result.correct ? "Correct!" : `Not quite. The answer is ${result.answer}.`}
                </p>
                <div className="mt-2 text-sm text-ink"><Rich text={result.explanation} /></div>
                {!result.saved && (
                  <p className="mt-3 text-xs text-muted">
                    <Link href="/signup" className="font-semibold text-red hover:underline">Create a free account</Link> to save your progress and track weak spots.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={prev} disabled={idx === 0}><IArrowL className="h-4 w-4" /> Previous</Button>
              {result ? (
                idx < ids.length - 1 ? (
                  <Button onClick={next}>Next question <IArrowR className="h-4 w-4" /></Button>
                ) : (
                  <Link href={backHref} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-600">Finish set</Link>
                )
              ) : (
                <Button onClick={check} disabled={!resp || busy}>Check answer</Button>
              )}
            </div>
            <p className="mt-4 hidden text-xs text-muted sm:block">Shortcuts: A–D to choose, Enter to check, → for next.</p>
          </section>
        </div>
      )}
    </div>
  );
}
