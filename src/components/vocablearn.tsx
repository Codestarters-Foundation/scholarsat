"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Vocab } from "@/data/vocab";
import { Badge, Button, Card, Progress } from "./ui";
import { Owl } from "./Owl";
import { AiAsk } from "./AiAsk";
import { ICheck, IRefresh, ISpeaker, IX } from "./icons";
import { MEMORY_TRICK_SYSTEM, memoryTrickPrompt } from "@/lib/ai-prompts";
import { MASTERED_BOX, knownAfter, reviewCard, type SrsState } from "@/lib/srs";
import {
  SESSION_NEW,
  SESSION_REVIEWS,
  answerStep,
  buildSession,
  checkTyped,
  chooseKind,
  formatDue,
  keyOf,
  makeQuestion,
  splitExample,
  startSession,
  summarize,
  type LearnQuestion,
  type QuestionKind,
  type SessionItem,
  type SessionState,
} from "@/lib/vocab-learn";

const LS_KEY = "ss_vocab_srs_v1";

/** Signed-out progress lives in this browser only. */
function loadLocal(): Record<string, SrsState> {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, SrsState> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, Partial<SrsState> | null>)) {
      if (v && Number.isFinite(v.box) && Number.isFinite(v.due) && Number.isFinite(v.reps) && Number.isFinite(v.lapses)) {
        out[k] = { box: v.box as number, due: v.due as number, reps: v.reps as number, lapses: v.lapses as number };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveLocal(map: Record<string, SrsState>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

const KIND_LABEL: Record<QuestionKind, string> = {
  def2word: "Match the meaning",
  cloze: "Complete the sentence",
  type: "Type the word",
};

type Phase = "home" | "session" | "summary";
type Result = { correct: boolean; note?: "close" | "skipped"; next: SessionState };

/** The example sentence with the studied word highlighted. */
function Example({ ex, word }: { ex: string; word: string }) {
  return (
    <>
      {splitExample(ex, word).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-gold-50 px-0.5 font-medium not-italic text-ink">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function speak(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.85;
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  } catch {}
}

function SpeakButton({ word }: { word: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(word)}
      title="Listen to pronunciation"
      aria-label={`Hear ${word}`}
      className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <ISpeaker className="h-4 w-4" />
    </button>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: "red" | "gold" | "ok" }) {
  const c = { red: "text-red", gold: "text-gold-600", ok: "text-ok" }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5 text-center">
      <p className={`text-2xl font-medium tabular-nums ${c}`}>{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

export function VocabLearn({
  words,
  known,
  initialSrs,
  signedIn,
  onMasteryChange,
  active = true,
}: {
  /** False while another tab is showing: keeps this screen mounted (so progress is not reset) but silences its shortcuts. */
  active?: boolean;
  words: Vocab[];
  known: ReadonlySet<string>;
  initialSrs: Record<string, SrsState>;
  signedIn: boolean;
  /** Tells the parent when Learn mode promotes or demotes a word, so its mastered count stays right. */
  onMasteryChange: (word: string, isKnown: boolean) => void;
}) {
  const [srs, setSrs] = useState<Record<string, SrsState>>(initialSrs);
  const srsRef = useRef<Record<string, SrsState>>(initialSrs);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [phase, setPhase] = useState<Phase>("home");
  const [items, setItems] = useState<SessionItem[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [question, setQuestion] = useState<LearnQuestion | null>(null);
  const [intro, setIntro] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [saveError, setSaveError] = useState(false);
  const allWords = useMemo(() => new Set(words.map(keyOf)), [words]);

  // Time and localStorage only exist in the browser, so they are read after mount (keeps server and client markup identical).
  useEffect(() => {
    if (!signedIn) {
      const local = loadLocal();
      srsRef.current = local;
      setSrs(local);
      for (const [w, s] of Object.entries(local)) if (s.box >= MASTERED_BOX) onMasteryChange(w, true);
    }
    setNow(Date.now());
    setReady(true);
  }, [signedIn, onMasteryChange]);

  const summary = useMemo(() => (ready ? summarize(words, srs, known, now) : null), [ready, words, srs, known, now]);

  /** Applies one first-attempt answer to the word's schedule and saves it. */
  const record = useCallback(
    (word: string, correct: boolean) => {
      const next = reviewCard(srsRef.current[word], correct, Date.now());
      const updated = { ...srsRef.current, [word]: next };
      srsRef.current = updated;
      setSrs(updated);
      const was = known.has(word);
      const is = knownAfter(was, next.box);
      if (is !== was) onMasteryChange(word, is);
      if (signedIn) {
        fetch("/api/vocab/review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ word, correct }),
        })
          .then((r) => {
            if (!r.ok) setSaveError(true);
          })
          .catch(() => setSaveError(true));
      } else {
        saveLocal(updated);
      }
    },
    [known, onMasteryChange, signedIn],
  );

  /** Shows the front card of a session state: an intro for brand-new words, otherwise a question. */
  const present = useCallback(
    (st: SessionState) => {
      const front = st.queue[0];
      setPicked(null);
      setTyped("");
      setResult(null);
      if (!front) {
        setQuestion(null);
        setIntro(false);
        return;
      }
      setIntro(front.item.isNew && !front.retryOf);
      setQuestion(makeQuestion(front.item.word, chooseKind(front), words, Math.random));
    },
    [words],
  );

  const start = useCallback(
    (ahead: boolean) => {
      const t = Date.now();
      const built = buildSession(words, srsRef.current, known, t, Math.random, { ahead });
      if (!built.length) return;
      const st = startSession(built);
      setNow(t);
      setItems(built);
      setSession(st);
      setSaveError(false);
      setPhase("session");
      present(st);
    },
    [words, known, present],
  );

  const settle = useCallback(
    (correct: boolean, note?: "close" | "skipped") => {
      if (!session || !question || result) return;
      const { state, report } = answerStep(session, question.kind, correct);
      setResult({ correct, note, next: state });
      if (report) record(report.word, report.correct);
    },
    [session, question, result, record],
  );

  const pick = useCallback(
    (i: number) => {
      if (!question || question.kind === "type" || result) return;
      setPicked(i);
      settle(i === question.answer);
    },
    [question, result, settle],
  );

  const submitTyped = (e: FormEvent) => {
    e.preventDefault();
    if (!question || question.kind !== "type" || result || !typed.trim()) return;
    const r = checkTyped(typed, question.target, allWords);
    settle(r !== "wrong", r === "close" ? "close" : undefined);
  };

  const advance = () => {
    if (!result) return;
    setSession(result.next);
    if (!result.next.queue.length) setPhase("summary");
    present(result.next);
  };

  const backHome = () => {
    setNow(Date.now());
    setPhase("home");
  };

  // 1-4 pick an answer on multiple-choice cards. Enter is handled by the focused button or form.
  useEffect(() => {
    if (!active || phase !== "session" || intro || result || !question || question.kind === "type") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.choices.length) {
        e.preventDefault();
        pick(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, phase, intro, result, question, pick]);

  // ------------------------------------------------------------------ home

  if (phase === "home") {
    if (!summary) {
      return (
        <div className="mx-auto w-full max-w-2xl">
          <Card className="min-h-[320px]">
            <p className="sr-only">Loading your study queue</p>
          </Card>
        </div>
      );
    }
    const reviews = Math.min(summary.due, SESSION_REVIEWS);
    const fresh = summary.due > SESSION_REVIEWS * 2 ? 0 : Math.min(summary.fresh, SESSION_NEW);
    const count = reviews + fresh;
    const nothingLeft = summary.fresh === 0 && summary.due === 0 && summary.learning === 0;
    return (
      <div className="mx-auto grid w-full max-w-2xl gap-4 animate-rise">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Owl size={64} mood={count > 0 ? "idle" : "celebrate"} />
            <div className="min-w-0">
              <h2 className="text-xl font-medium text-ink">Learn words that stick</h2>
              <p className="mt-1 text-sm text-muted">
                Short sessions mix a few new words with reviews. You will recall each word from its meaning, use it in a real
                sentence, then type it from memory. Words you miss come back sooner; words you know come back later.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Tile label="Due now" value={summary.due} tone="red" />
            <Tile label="New" value={summary.fresh} tone="gold" />
            <Tile label="Mastered" value={summary.mastered} tone="ok" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {count > 0 ? (
              <Button size="lg" onClick={() => start(false)}>
                Start session · {count} {count === 1 ? "word" : "words"}
              </Button>
            ) : nothingLeft ? (
              <p className="text-sm text-ok font-medium">You have worked through every word. Nice.</p>
            ) : (
              <>
                <p className="text-sm text-ink-2">
                  You are all caught up.
                  {summary.nextDue !== null && <> Next review {formatDue(summary.nextDue, now)}.</>}
                </p>
                {summary.learning > 0 && (
                  <Button variant="secondary" onClick={() => start(true)}>
                    <IRefresh className="h-4 w-4" /> Review ahead
                  </Button>
                )}
              </>
            )}
          </div>
          {!signedIn && (
            <p className="mt-4 text-xs text-muted">
              Your progress is saved in this browser. Create a free account to keep it across devices.
            </p>
          )}
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------- summary

  if (phase === "summary" && session) {
    const right = Object.values(session.firstTry).filter(Boolean).length;
    const missed = items.filter((i) => session.firstTry[keyOf(i.word)] === false);
    const newCount = items.filter((i) => i.isNew).length;
    const next = summarize(words, srsRef.current, known, Date.now());
    const more = Math.min(next.due, SESSION_REVIEWS) + (next.due > SESSION_REVIEWS * 2 ? 0 : Math.min(next.fresh, SESSION_NEW));
    return (
      <div className="mx-auto w-full max-w-xl animate-rise">
        <Card className="flex flex-col items-center p-8 text-center">
          <Owl size={96} mood={right >= session.total * 0.7 ? "celebrate" : "idle"} />
          <h2 className="mt-4 text-2xl font-medium text-ink">Session complete</h2>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-ink tabular-nums">{right}</span> of{" "}
            <span className="tabular-nums">{session.total}</span> right on the first try
            {newCount > 0 && <> · {newCount} new</>}
          </p>
          {missed.length > 0 && (
            <div className="mt-5 w-full rounded-xl border border-line bg-surface p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Coming back soon</p>
              <ul className="mt-2 grid gap-1.5">
                {missed.map((i) => (
                  <li key={i.word.word} className="text-sm text-ink-2">
                    <span className="font-serif text-base text-ink">{i.word.word}</span> · {i.word.def}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {next.nextDue !== null && next.due === 0 && (
            <p className="mt-4 text-xs text-muted">Next review {formatDue(next.nextDue, Date.now())}.</p>
          )}
          {saveError && (
            <p role="alert" className="mt-4 text-xs text-bad">
              Some answers could not be saved. Check your connection before you leave this page.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {more > 0 && <Button onClick={() => start(false)}>Keep going</Button>}
            <Button variant="secondary" onClick={backHome}>
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------- session

  const front = session?.queue[0];
  if (!session || !front || !question) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Card className="text-center">
          <p className="text-sm text-muted">Nothing to study right now.</p>
          <Button className="mt-4" variant="secondary" onClick={backHome}>
            Back
          </Button>
        </Card>
      </div>
    );
  }
  const target = question.target;
  const retry = !!front.retryOf;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <div className="flex items-center gap-3">
        <Progress value={session.done / session.total} tone="ok" className="h-1.5 flex-1" />
        <span className="text-xs font-medium tabular-nums text-muted">
          {session.done} / {session.total}
        </span>
        <Button variant="ghost" size="sm" onClick={backHome} aria-label="End session">
          <IX className="h-4 w-4" /> End
        </Button>
      </div>

      {intro ? (
        <Card className="animate-rise p-6 sm:p-9">
          <div className="flex items-center justify-between">
            <Badge tone="gold">New word</Badge>
            <SpeakButton word={target.word} />
          </div>
          <p className="mt-4 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">{target.word}</p>
          <p className="mt-1 text-sm italic text-muted">{target.pos}</p>
          <p className="mt-5 text-xl font-medium leading-snug text-ink">{target.def}</p>
          <p className="mt-4 rounded-xl border border-line bg-surface p-3.5 text-sm italic text-ink-2">
            &ldquo;
            <Example ex={target.ex} word={target.word} />
            &rdquo;
          </p>
          <Button autoFocus className="mt-6 w-full" onClick={() => setIntro(false)}>
            Got it, quiz me
          </Button>
        </Card>
      ) : (
        <Card key={`${target.word}-${retry ? "r" : "q"}-${session.done}`} className="animate-rise p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <Badge tone={retry ? "warn" : "neutral"}>{retry ? "Try again" : KIND_LABEL[question.kind]}</Badge>
            <span className="text-xs text-faint">
              {question.kind === "type" ? "Enter to check" : "Press 1–4 to answer"}
            </span>
          </div>

          {question.kind === "cloze" ? (
            <p className="mt-5 font-serif text-xl leading-relaxed text-ink sm:text-2xl">
              {question.prompt.split("_____").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span
                      role="img"
                      aria-label="blank"
                      className="mx-1 inline-block min-w-[5.5rem] border-b-2 border-ink align-baseline"
                    >
                      &nbsp;
                    </span>
                  )}
                </span>
              ))}
            </p>
          ) : (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {question.kind === "type" ? "Which word means" : "Which word matches this meaning?"}
              </p>
              <p className="mt-2 text-xl font-medium leading-snug text-ink sm:text-2xl">&ldquo;{question.prompt}&rdquo;</p>
              {question.kind === "type" && <p className="mt-2 text-xs italic text-muted">{question.hint}</p>}
            </div>
          )}

          {question.kind === "type" ? (
            <form onSubmit={submitTyped} className="mt-6 grid gap-3">
              <input
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={!!result}
                aria-label="Type the word"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder="Type the word…"
                className="w-full rounded-xl border border-line-strong bg-bg px-3.5 py-3 font-serif text-lg text-ink outline-none transition-all placeholder:text-muted focus:border-red focus:ring-3 focus:ring-red/15 disabled:opacity-70"
              />
              {!result && (
                <div className="flex gap-2">
                  <Button type="submit" disabled={!typed.trim()} className="flex-1">
                    Check
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => settle(false, "skipped")}>
                    I don&apos;t know
                  </Button>
                </div>
              )}
            </form>
          ) : (
            <div className="mt-6 grid gap-2.5">
              {question.choices.map((c, i) => {
                const isAnswer = i === question.answer;
                let style = "border-line bg-surface text-ink hover:bg-surface-2";
                if (result) {
                  if (isAnswer) style = "border-ok bg-ok-50 font-medium text-ok ring-2 ring-ok/20";
                  else if (picked === i) style = "border-bad bg-bad-50 font-medium text-bad";
                  else style = "border-line bg-bg text-muted opacity-50";
                }
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={!!result}
                    onClick={() => pick(i)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${style}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-4 text-xs tabular-nums text-faint">{i + 1}</span>
                      <span className="font-serif text-base">{c}</span>
                    </span>
                    {result && isAnswer && <ICheck className="h-4 w-4 text-ok" />}
                  </button>
                );
              })}
            </div>
          )}

          {result && (
            <div className="mt-6 grid animate-rise gap-3" role="status">
              <p className={`text-sm font-medium ${result.correct ? "text-ok" : "text-bad"}`}>
                {result.correct
                  ? result.note === "close"
                    ? `Almost. It is spelled “${target.word}”.`
                    : retry
                      ? "Got it this time."
                      : "Correct."
                  : result.note === "skipped"
                    ? "No problem. Here it is, and we will ask again soon."
                    : "Not quite, and we will ask again in a moment."}
              </p>
              <div className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p>
                    <span className="font-serif text-xl font-medium text-ink">{target.word}</span>{" "}
                    <span className="text-xs italic text-muted">{target.pos}</span>
                  </p>
                  <SpeakButton word={target.word} />
                </div>
                <p className="mt-1 text-sm text-ink-2">{target.def}</p>
                <p className="mt-2 text-sm italic text-muted">
                  &ldquo;
                  <Example ex={target.ex} word={target.word} />
                  &rdquo;
                </p>
              </div>
              <AiAsk
                key={target.word}
                label="Memory trick"
                system={MEMORY_TRICK_SYSTEM}
                prompt={memoryTrickPrompt(target)}
              />
              <Button autoFocus onClick={advance} className="w-full">
                Continue
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
