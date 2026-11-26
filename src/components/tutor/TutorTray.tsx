"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui";
import { IArrowL, IArrowR, IRefresh, ISparkle, IX } from "../icons";
import { useTutorConnection } from "../Tutor";
import { AiConnect } from "../AiConnect";
import { MARK_CSS, MarkLayers, type Placed } from "./TutorMarks";
import { Whiteboard } from "./Whiteboard";
import { useAiConfig } from "@/lib/use-ai-config";
import { AiError, PROVIDERS, repairModel, saveAiConfig, streamChat, type AiConfig, type ChatMessage } from "@/lib/ai";
import { anchorMark, ensureHost, getRegions, removeHosts, revealIfHidden } from "@/lib/tutor-anchor";
import {
  TUTOR_DRAW_SYSTEM,
  followUpRequest,
  lessonRequest,
  parseLesson,
  quickAsks,
  trimHistory,
  type Step,
  type TutorQuestion,
} from "@/lib/tutor-lesson";
import { setTutorOpen, useTutorOpenFor } from "@/lib/tutor-store";

export type TutorProps = {
  q: TutorQuestion & { id: string };
  /** what the student picked or typed */
  response: string;
  /** the official answer */
  answer: string;
  explanation: string;
  correct: boolean;
};

type Turn = { key: number; label: string; status: "loading" | "done" | "error"; steps: Step[]; error: string };

const DOT: Record<string, string> = { highlight: "#f5b700", underline: "#2f6df0", circle: "#e5484d", strike: "#e5484d", check: "#1f9d55" };
const MAX_TOKENS = 3500;

/** Renders only while this question's tutor is open (see tutor-store). */
export function TutorTray(props: TutorProps) {
  const open = useTutorOpenFor() === props.q.id;
  return open ? <Tray {...props} /> : null;
}

function Tray({ q, response, answer, explanation, correct }: TutorProps) {
  const cfg = useAiConfig();
  const connection = useTutorConnection();
  const viaStudy = connection.mode !== "provider" && (connection.chosen || cfg === null);
  const [planReady,setPlanReady] = useState<boolean | null>(null);
  useEffect(() => {
    if (!viaStudy || connection.mode !== "plan") return;
    const ac = new AbortController();
    fetch("/api/study/connect",{cache:"no-store",signal:ac.signal}).then(async r=>{
      const connected = r.ok && (await r.json()).connected === true;
      if (!ac.signal.aborted) setPlanReady(connected);
    }).catch(()=>{ if(!ac.signal.aborted) setPlanReady(false); });
    return ()=>ac.abort();
  },[viaStudy,connection.mode]);
  const hasCfg = viaStudy ? (connection.mode==="plan" ? planReady === true : !!connection.key.trim()) : !!cfg;
  function changeConnection() {
    setTutorOpen(null);
    const panel = document.querySelector<HTMLDetailsElement>(".practice-player .study-tutor");
    if (panel) { panel.open = true; panel.scrollIntoView({block:"center"}); panel.querySelector("select")?.focus({preventScroll:true}); }
  }
  const ctx = useMemo(() => ({ answer, choices: q.choices?.length ?? 0 }), [answer, q.choices]);

  const [turn, setTurn] = useState<Turn | null>(null);
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState("");
  const [settings, setSettings] = useState(false);
  // On a phone the follow-up box starts folded away so the question stays visible.
  const [askOpen, setAskOpen] = useState(() => typeof window === "undefined" || !window.matchMedia || window.matchMedia("(min-width: 640px)").matches);

  const history = useRef<ChatMessage[]>([]);
  const abort = useRef<AbortController | null>(null);
  const cfgRef = useRef<AiConfig | null | undefined>(cfg);
  const turnCount = useRef(0);
  const scrolledFor = useRef("");
  const lastReq = useRef<{ label: string; content: string } | null>(null);

  useEffect(() => {
    cfgRef.current = cfg;
  });

  const ask = useCallback(
    async (label: string, content: string) => {
      const c = cfgRef.current;
      if (!c && !viaStudy) return;
      abort.current?.abort();
      const ac = new AbortController();
      abort.current = ac;
      const key = ++turnCount.current;
      lastReq.current = { label, content };
      const messages = trimHistory([...history.current, { role: "user", content }]);
      setTurn({ key, label, status: "loading", steps: [], error: "" });
      setIdx(0);
      let acc = "";
      const attempt = (cc: AiConfig) =>
        streamChat(cc, {
          system: TUTOR_DRAW_SYSTEM,
          messages,
          signal: ac.signal,
          maxTokens: MAX_TOKENS,
          onText: (d) => {
            acc += d;
            const p = parseLesson(acc, ctx, false);
            setTurn((t) => (t && t.key === key && t.status === "loading" ? { ...t, steps: p.steps } : t));
          },
        });
      try {
        if (viaStudy) {
          const r = await fetch("/api/study/tutor", {
            method:"POST", headers:{"Content-Type":"application/json"}, signal:ac.signal,
            body:JSON.stringify({item:q.id, task:"lesson", response, followup:label || undefined,
              previous:label ? history.current.filter(m=>m.role==="assistant").at(-1)?.content.slice(0,8000) : undefined, mode:connection.mode,
              key:connection.mode==="key" ? connection.key : undefined}),
          });
          const data = await r.json();
          if (!r.ok) throw new AiError(data.error || "Unable to get the lesson.");
          acc = data.explanation;
        } else if (c) try {
          await attempt(c);
        } catch (e) {
          // Providers retire models. If ours is gone, switch to one that works and try once more.
          if (!(e instanceof AiError) || e.kind !== "model" || ac.signal.aborted) throw e;
          const fixed = await repairModel(c);
          if (!fixed || ac.signal.aborted) throw e;
          saveAiConfig(fixed);
          acc = "";
          await attempt(fixed);
        }
        if (ac.signal.aborted) return;
        const p = parseLesson(acc, ctx, true);
        if (!p.steps.length) throw new AiError("I couldn't turn that answer into a lesson. Try again.");
        history.current = [...history.current, { role: "user", content }, { role: "assistant", content: acc }];
        setTurn({ key, label, status: "done", steps: p.steps, error: "" });
      } catch (e) {
        if (ac.signal.aborted) return;
        const msg = e instanceof AiError ? e.message : "Something went wrong. Try again.";
        setTurn((t) => ({ key, label, status: "error", steps: t && t.key === key ? t.steps : [], error: msg }));
      }
    },
    [ctx, viaStudy, q.id, response, connection.mode, connection.key],
  );

  const start = useRef(() => {});
  useEffect(() => {
    start.current = () => void ask("", lessonRequest(q, response, answer, explanation, correct));
  });

  // Teach as soon as the tutor opens (or as soon as the student finishes connecting an AI account).
  useEffect(() => {
    if (!hasCfg) return;
    start.current();
    return () => abort.current?.abort();
  }, [hasCfg]);

  // Work out where each drawing goes on screen. Re-runs when steps arrive, the step changes, or the layout moves.
  const steps = turn?.steps;
  const turnKey = turn?.key ?? 0;
  useEffect(() => {
    if (!steps) {
      setPlaced([]);
      return;
    }
    const regions = getRegions();
    const list: Placed[] = [];
    steps.slice(0, idx + 1).forEach((s, si) => {
      let badge = 0;
      s.marks.forEach((m, mi) => {
        if (m.note) badge++;
        const a = anchorMark(m, regions);
        if (!a) return;
        list.push({ id: `t${turnKey}-${si}-${mi}`, kind: m.kind, boxes: a.boxes, gutter: a.gutter, host: ensureHost(a.region), badge: m.note ? badge : undefined, old: si < idx });
      });
    });
    setPlaced(list);
  }, [steps, idx, tick, turnKey]);

  // Keep drawings glued to their words when the layout changes (window resize, tray opening, fonts loading).
  useEffect(() => {
    const regions = getRegions();
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTick((t) => t + 1));
    };
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(bump);
    for (const r of [regions.left, regions.right]) if (r) ro?.observe(r);
    window.addEventListener("resize", bump);
    void document.fonts?.ready.then(bump);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", bump);
      removeHosts(regions);
    };
  }, []);

  // Bring the newest drawing into view (it may be off-screen on a phone or in a long passage).
  useEffect(() => {
    const current = placed.filter((p) => !p.old);
    if (!current.length) return;
    const k = `${turnKey}-${idx}`;
    if (scrolledFor.current === k) return;
    scrolledFor.current = k;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const el = current[0].host.querySelector<HTMLElement>(`[data-mark="${current[0].id}"] [data-anchor]`);
    if (el) revealIfHidden(el, !reduce);
  }, [placed, idx, turnKey]);

  const step = steps?.[idx];
  const loading = turn?.status === "loading";
  const total = steps?.length ?? 0;
  const noted = step?.marks.map((m, i) => ({ m, i })).filter((x) => x.m.note) ?? [];
  const stepHasMarks = !!step && step.marks.length > 0;
  const stepDrawn = placed.some((p) => !p.old);
  const asks = quickAsks(q, response, correct);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setDraft("");
    void ask(t, followUpRequest(t));
  };

  const nav =
    total > 0 ? (
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
          <IArrowL className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Lesson steps">
          {steps!.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Step ${i + 1} of ${total}`}
              aria-current={i === idx ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all ${i === idx ? "w-6 bg-red" : "w-2.5 bg-line-strong hover:bg-muted"}`}
            />
          ))}
          {loading && <span className="ml-1 text-xs text-faint">writing…</span>}
        </div>
        {idx < total - 1 ? (
          <Button type="button" size="sm" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
            Next <IArrowR className="h-4 w-4" />
          </Button>
        ) : loading ? (
          <Button type="button" size="sm" disabled>
            Next <IArrowR className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={() => setIdx(0)}>
            <IRefresh className="h-4 w-4" /> Replay
          </Button>
        )}
      </div>
    ) : null;

  return (
    <div
      role="region"
      aria-label="Tutor"
      // The practice screen listens for Enter and the arrow keys on the whole window to check, go back and go
      // forward. Keys pressed inside the tutor are the tutor's own.
      onKeyDown={(e) => e.stopPropagation()}
      className="shrink-0 border-t-4 border-red-700 bg-bg"
    >
      <style>{MARK_CSS}</style>
      <MarkLayers placed={placed} />
      <div className="scroll-thin max-h-[40vh] overflow-y-auto px-4 py-2.5 sm:px-6">
        <div className="mx-auto grid max-w-[1100px] gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-red">
              <ISparkle className="h-4 w-4" />
            </span>
            <p className="text-[15px] font-medium text-ink">Tutor</p>
            {hasCfg && <span className="text-xs text-ink-2">{viaStudy ? ({plan:"My ChatGPT plan",key:"OpenAI API key"}[connection.mode]) : cfg && PROVIDERS[cfg.provider].label}</span>}
            <span className="flex-1" />
            {nav}
            <button type="button" onClick={() => setTutorOpen(null)} aria-label="Close tutor" className="rounded-lg p-1.5 text-muted hover:bg-surface-2">
              <IX className="h-4 w-4" />
            </button>
          </div>

          {!hasCfg ? (
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="mb-3 text-sm text-ink-2">
                Connect your ChatGPT plan or enter a personal API key to get an annotated lesson.
              </p>
              {viaStudy ? <Button type="button" variant="secondary" onClick={changeConnection}>Choose AI connection</Button> : cfg === null && <AiConnect />}
            </div>
          ) : (
            <>
              {settings && !viaStudy && (
                <div className="rounded-xl border border-line bg-surface p-4">
                  <AiConnect onConnected={() => setSettings(false)} />
                </div>
              )}
              <div className={`grid gap-4 ${steps?.some((s) => s.board.length) ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]" : ""}`}>
                <div className="grid content-start gap-2">
                  {turn?.label && <p className="text-xs text-muted">You asked: “{turn.label}”</p>}

                  {step ? (
                    <div aria-live="polite" className="grid gap-1.5">
                      <p data-testid="tutor-say" className="text-[16px] leading-relaxed text-ink">
                        {step.say}
                      </p>
                      {noted.length > 0 && (
                        <ul className="flex flex-wrap gap-x-4 gap-y-1">
                          {noted.map((n, k) => (
                            <li key={n.i} className="flex items-center gap-1.5 text-sm text-ink-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: DOT[n.m.kind] }}>
                                {k + 1}
                              </span>
                              <span>{n.m.note}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {stepHasMarks && !stepDrawn && !loading && (
                        <p className="text-xs text-faint">I couldn’t point at this one on screen, but the words above still apply.</p>
                      )}
                    </div>
                  ) : loading ? (
                    <p className="text-sm text-muted" role="status">
                      Getting your lesson ready…
                    </p>
                  ) : null}

                  {turn?.status === "error" && (
                    <div className="flex flex-wrap items-center gap-3">
                      <p role="alert" className="text-sm text-bad">
                        {turn.error}
                      </p>
                      <Button type="button" variant="secondary" size="sm" onClick={() => lastReq.current && void ask(lastReq.current.label, lastReq.current.content)}>
                        <IRefresh className="h-4 w-4" /> Try again
                      </Button>
                    </div>
                  )}
                </div>

                {steps && steps.length > 0 && <Whiteboard steps={steps} upTo={idx} />}
              </div>

              <div className="grid gap-1.5 border-t border-line pt-2.5">
                {askOpen ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {asks.map((a) => (
                      <button
                        key={a}
                        type="button"
                        disabled={loading}
                        onClick={() => send(a)}
                        className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-2 transition-colors hover:border-red hover:text-red disabled:opacity-50"
                      >
                        {a}
                      </button>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        send(draft);
                      }}
                      className="flex min-w-[220px] flex-1 gap-2"
                    >
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={300}
                        aria-label="Ask the tutor a question"
                        placeholder="Ask anything about this question…"
                        className="min-w-0 flex-1 rounded-xl border-2 border-line-strong bg-bg px-3 py-1.5 text-sm outline-none focus:border-red"
                      />
                      <Button type="submit" variant="secondary" size="sm" disabled={!draft.trim() || loading}>
                        Ask
                      </Button>
                    </form>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAskOpen(true)} className="justify-self-start text-sm font-medium text-red hover:underline">
                    Ask a follow-up question
                  </button>
                )}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <p className="text-[11px] text-faint">AI can be wrong. If it disagrees with the official explanation, trust the official one.</p>
                  <button type="button" onClick={viaStudy ? changeConnection : () => setSettings((v) => !v)} aria-expanded={viaStudy ? undefined : settings} className="text-[11px] text-muted hover:text-red">
                    AI settings
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
