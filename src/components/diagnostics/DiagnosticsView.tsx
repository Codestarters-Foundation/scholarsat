"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AttemptRec, HistoryRow, SkillStat } from "@/lib/diagnostics";
import { MIN_FOR_PREDICTION, sectionScore } from "@/lib/scoring";
import { SECTION_LABEL } from "@/lib/types";
import { Badge, Button, EmptyState, Progress } from "../ui";
import { ICalc, IChevD, ICheckCircle, IChevR, IStar, IXCircle } from "../icons";
import { ScoreCalculator } from "./ScoreCalculator";

type Props = {
  predicted: { rw: number; math: number; total: number } | null;
  seen: { math: number; rw: number };
  total: number;
  split: { math: number; rw: number };
  strongest: SkillStat[];
  weakest: SkillStat[];
  recs: AttemptRec[];
  history: HistoryRow[];
  tests: { t: number; total: number }[];
  historyTruncated: boolean;
  goal: number | null;
};

const DAY = 86400000;
const dayStart = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const fmtDay = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function ago(t: number, now: number) {
  const m = Math.max(0, Math.round((now - t) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
const fmtTime = (t: number) => new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const fmtDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

/* ------------------------------------------------------------------ chart */

type RangeKey = "7" | "14" | "30" | "90" | "all";
const RANGES: { key: RangeKey; label: string; short: string }[] = [
  { key: "7", label: "7 Days", short: "7d" },
  { key: "14", label: "14 Days", short: "14d" },
  { key: "30", label: "30 Days", short: "30d" },
  { key: "90", label: "90 Days", short: "90d" },
  { key: "all", label: "All Time", short: "All" },
];

function ProgressChart({ recs, tests, goal, now }: { recs: AttemptRec[]; tests: { t: number; total: number }[]; goal: number | null; now: number }) {
  const [range, setRange] = useState<RangeKey>("14");
  const [mode, setMode] = useState<"questions" | "score">("questions");
  const [hover, setHover] = useState<number | null>(null);

  const days = useMemo(() => {
    const today = dayStart(now);
    const first = recs.length ? dayStart(recs[0].t) : today;
    const n = range === "all" ? Math.max(7, Math.round((today - first) / DAY) + 1) : Number(range);
    return Array.from({ length: n }, (_, i) => today - (n - 1 - i) * DAY);
  }, [range, recs, now]);

  const data = useMemo(() => {
    const idx = new Map(days.map((d, i) => [d, i]));
    const correct = days.map(() => 0), wrong = days.map(() => 0);
    for (const r of recs) {
      const i = idx.get(dayStart(r.t));
      if (i === undefined) continue;
      if (r.c) correct[i]++;
      else wrong[i]++;
    }
    // Predicted score at the end of each day, from the latest answer to every question so far.
    const latest = new Map<string, { c: number; s: number }>();
    const cnt = [{ seen: 0, ok: 0 }, { seen: 0, ok: 0 }];
    const endOfDay = new Map<number, number | null>();
    for (const r of recs) {
      const prev = latest.get(r.k);
      if (prev) {
        cnt[prev.s].seen--;
        cnt[prev.s].ok -= prev.c;
      }
      latest.set(r.k, { c: r.c, s: r.s });
      cnt[r.s].seen++;
      cnt[r.s].ok += r.c;
      endOfDay.set(dayStart(r.t), cnt[0].seen >= MIN_FOR_PREDICTION && cnt[1].seen >= MIN_FOR_PREDICTION ? sectionScore(cnt[0].ok / cnt[0].seen) + sectionScore(cnt[1].ok / cnt[1].seen) : null);
    }
    const sortedDays = [...endOfDay.keys()].sort((a, b) => a - b);
    let p = 0, cur: number | null = null;
    const predicted = days.map((d) => {
      while (p < sortedDays.length && sortedDays[p] <= d) cur = endOfDay.get(sortedDays[p++]) ?? null;
      return cur;
    });
    const testAt = days.map((d) => tests.filter((t) => dayStart(t.t) === d).map((t) => t.total).at(-1) ?? null);
    return { correct, wrong, predicted, testAt };
  }, [days, recs, tests]);

  // Geometry
  const W = 760, H = 300, L = 58, R = goal && mode === "score" ? 64 : 16, T = 14, B = 34;
  const pw = W - L - R, ph = H - T - B;
  const n = days.length;
  const slot = pw / n;
  const x = (i: number) => L + slot * i + slot / 2;

  const maxQ = Math.max(5, ...days.map((_, i) => data.correct[i] + data.wrong[i]));
  const qStep = Math.ceil(maxQ / 4 / 5) * 5 || 5;
  const qMax = qStep * 4;

  const scoreVals = [...data.predicted, ...data.testAt, goal].filter((v): v is number => v !== null && v !== undefined);
  let sLo = scoreVals.length ? Math.min(...scoreVals) - 100 : 800, sHi = scoreVals.length ? Math.max(...scoreVals) + 100 : 1400;
  sLo = Math.max(400, Math.floor(sLo / 100) * 100);
  sHi = Math.min(1600, Math.ceil(sHi / 100) * 100);
  if (sHi - sLo < 200) sHi = Math.min(1600, sLo + 200);
  const yS = (v: number) => T + ph - ((v - sLo) / (sHi - sLo)) * ph;
  const yQ = (v: number) => T + ph - (v / qMax) * ph;

  const labelEvery = Math.max(1, Math.ceil(n / 7));
  const hasData = recs.some((r) => dayStart(r.t) >= days[0]);
  const scoreHasData = scoreVals.length > (goal ? 1 : 0);
  const barW = Math.min(36, slot * 0.68);
  const line = data.predicted.map((v, i) => (v === null ? null : `${x(i).toFixed(1)} ${yS(v).toFixed(1)}`)).filter(Boolean);

  const readout =
    hover === null
      ? "Hover a day for details"
      : mode === "questions"
        ? `${fmtDay(days[hover])}: ${data.correct[hover]} correct, ${data.wrong[hover]} incorrect`
        : `${fmtDay(days[hover])}: ${data.predicted[hover] !== null ? `predicted ${data.predicted[hover]}` : "no prediction yet"}${data.testAt[hover] !== null ? `, test ${data.testAt[hover]}` : ""}`;

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[19px] font-medium">Progress Over Time</h2>
        <div className="flex flex-wrap items-center gap-2">
          {goal ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold-100 bg-gold-50 px-3 py-1.5 text-[13px] font-medium text-gold-700"><IStar className="h-4 w-4" /> Goal: {goal}</span>
          ) : (
            <Link href="/settings" className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[13px] text-muted hover:text-ink"><IStar className="h-4 w-4" /> Set a goal</Link>
          )}
          <div className="inline-flex rounded-lg bg-surface-2 p-0.5" role="tablist" aria-label="Chart view">
            {(["questions", "score"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${mode === m ? "bg-white text-red shadow-card" : "text-muted hover:text-ink"}`}>{m === "questions" ? "Questions" : "SAT score"}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {mode === "questions" ? (
            <>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ok-500" />Correct</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-bad" />Incorrect</li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-red" />Predicted</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" />Practice test</li>
              {goal && <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-gold" />Goal ({goal})</li>}
            </>
          )}
        </ul>
        <div className="inline-flex rounded-lg bg-surface-2 p-0.5" role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.key} role="tab" aria-selected={range === r.key} onClick={() => setRange(r.key)} className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-[13px] ${range === r.key ? "bg-white text-red shadow-card" : "text-muted hover:text-ink"}`}><span className="sm:hidden">{r.short}</span><span className="hidden sm:inline">{r.label}</span></button>
          ))}
        </div>
      </div>

      <p className="mt-3 h-5 text-[13px] text-muted tabular-nums" aria-live="polite">{readout}</p>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={mode === "questions" ? "Questions answered per day" : "Predicted SAT score over time"} onMouseLeave={() => setHover(null)}>
          {/* grid + y axis */}
          {(mode === "questions" ? [0, 1, 2, 3, 4].map((i) => ({ v: i * qStep, y: yQ(i * qStep) })) : Array.from({ length: Math.round((sHi - sLo) / 100) + 1 }, (_, i) => ({ v: sLo + i * 100, y: yS(sLo + i * 100) })).filter((_, i, a) => a.length <= 8 || i % 2 === 0)).map((g) => (
            <g key={g.v}>
              <line x1={L} x2={W - R} y1={g.y} y2={g.y} stroke="var(--line)" strokeDasharray={g.v === (mode === "questions" ? 0 : sLo) ? "" : "3 4"} />
              <text x={L - 8} y={g.y + 4} textAnchor="end" fontSize="11" fill="var(--faint)">{g.v}</text>
            </g>
          ))}
          <text x={11} y={T + ph / 2} transform={`rotate(-90 11 ${T + ph / 2})`} textAnchor="middle" fontSize="11" fill="var(--faint)">{mode === "questions" ? "Questions" : "SAT score"}</text>

          {mode === "questions" &&
            days.map((d, i) => {
              const c = data.correct[i], w = data.wrong[i];
              return (
                <g key={d}>
                  {w > 0 && <rect x={x(i) - barW / 2} y={yQ(c + w)} width={barW} height={yQ(0) - yQ(w)} rx="3" fill="var(--bad)" opacity={hover === null || hover === i ? 1 : 0.5} />}
                  {c > 0 && <rect x={x(i) - barW / 2} y={yQ(c)} width={barW} height={yQ(0) - yQ(c)} rx="3" fill="var(--ok-500)" opacity={hover === null || hover === i ? 1 : 0.5} />}
                </g>
              );
            })}

          {mode === "score" && (
            <>
              {goal && goal >= sLo && goal <= sHi && (
                <g>
                  <line x1={L} x2={W - R} y1={yS(goal)} y2={yS(goal)} stroke="var(--gold)" strokeWidth="2" strokeDasharray="6 5" />
                  <rect x={W - R + 6} y={yS(goal) - 11} width={50} height={22} rx="5" fill="var(--gold)" />
                  <text x={W - R + 31} y={yS(goal) + 4} textAnchor="middle" fontSize="12" fontWeight="500" fill="#fff">{goal}</text>
                </g>
              )}
              {line.length > 1 && <polyline points={line.join(" ")} fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
              {data.predicted.map((v, i) => v !== null && (i === 0 || data.predicted[i - 1] !== v || i === n - 1) && <circle key={`p${i}`} cx={x(i)} cy={yS(v)} r="3.5" fill="#fff" stroke="var(--red)" strokeWidth="2.5" />)}
              {data.testAt.map((v, i) => v !== null && <circle key={`t${i}`} cx={x(i)} cy={yS(v)} r="6" fill="var(--ink)" stroke="#fff" strokeWidth="2" />)}
            </>
          )}

          {days.map((d, i) => (i % labelEvery === 0 || i === n - 1) && <text key={`x${d}`} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--faint)">{fmtDay(d)}</text>)}
          {days.map((d, i) => <rect key={`h${d}`} x={L + slot * i} y={T} width={slot} height={ph} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />)}
        </svg>
        {((mode === "questions" && !hasData) || (mode === "score" && !scoreHasData)) && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-8 text-center text-sm text-muted">
            <p className="max-w-xs rounded-xl bg-white/90 px-4 py-3">
              {mode === "questions" ? "No questions answered in this range yet." : `Answer ${MIN_FOR_PREDICTION} questions in each section, or finish a practice test, and your score will chart here.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- history */

type Session = { key: string; source: "practice" | "test"; section: "math" | "rw"; rows: HistoryRow[] };

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm font-normal outline-none focus:border-red">{children}</select>
    </label>
  );
}

function History({ rows, total, truncated, now }: { rows: HistoryRow[]; total: number; truncated: boolean; now: number }) {
  const [source, setSource] = useState("all");
  const [subject, setSubject] = useState("all");
  const [result, setResult] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saved, setSaved] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState("");
  const [shown, setShown] = useState(25);

  // Reset to the first page whenever a filter changes.
  useEffect(() => setShown(25), [source, subject, result, from, to, saved]);

  const filtered = useMemo(() => {
    const f = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return rows.filter((r) => (source === "all" || r.source === source) && (subject === "all" || r.section === subject) && (result === "all" || (result === "correct") === r.correct) && r.t >= f && r.t <= t && (!saved || r.bookmarked));
  }, [rows, source, subject, result, from, to, saved]);

  // Group consecutive attempts of the same kind (within 45 minutes of each other) into sessions.
  const sessions = useMemo(() => {
    const out: Session[] = [];
    for (const r of filtered) {
      const last = out.at(-1);
      const prev = last?.rows.at(-1);
      if (last && prev && last.source === r.source && last.section === r.section && prev.t - r.t <= 45 * 60000) last.rows.push(r);
      else out.push({ key: `${r.t}-${r.id}`, source: r.source, section: r.section, rows: [r] });
    }
    return out;
  }, [filtered]);

  const today = dayStart(now);
  const dayLabel = (t: number) => {
    const d = dayStart(t);
    return d === today ? "Today" : d === today - DAY ? "Yesterday" : new Date(t).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/practice/play?ids=${id}&title=Review`);
      setCopied(id);
      setTimeout(() => setCopied(""), 1400);
    } catch {}
  };

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
        <Select label="Source" value={source} onChange={setSource}><option value="all">All Sources</option><option value="practice">Question Bank</option><option value="test">Practice Tests</option></Select>
        <Select label="Subject" value={subject} onChange={setSubject}><option value="all">All Subjects</option><option value="math">Math</option><option value="rw">Reading &amp; Writing</option></Select>
        <Select label="Result" value={result} onChange={setResult}><option value="all">All Results</option><option value="correct">Correct</option><option value="incorrect">Incorrect</option></Select>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">From Date<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full min-w-0 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-normal outline-none focus:border-red" /></label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">To Date<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full min-w-0 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-normal outline-none focus:border-red" /></label>
        <Button variant="secondary" size="md" aria-pressed={saved} onClick={() => setSaved((s) => !s)} className={`col-span-2 sm:col-span-1 ${saved ? "!border-red !bg-red-50 !text-red" : ""}`}>Bookmarked</Button>
      </div>

      {sessions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-white shadow-card">
          <EmptyState title={rows.length ? "No attempts match these filters." : "No attempts yet."} action={rows.length ? undefined : <Link href="/practice" className="text-sm font-medium text-red hover:underline">Start practicing →</Link>}>
            {rows.length ? "Try clearing a filter or widening the dates." : "Every question you answer shows up here, grouped into sessions."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6">
          {sessions.slice(0, shown).map((s, si) => {
            const showDay = si === 0 || dayStart(sessions[si - 1].rows[0].t) !== dayStart(s.rows[0].t);
            const ok = s.rows.filter((r) => r.correct).length;
            const pct = Math.round((ok / s.rows.length) * 100);
            const domains = [...new Set(s.rows.map((r) => r.domain))];
            const ms = s.rows.reduce((a, r) => a + (r.timeMs ?? 0), 0);
            const open = !closed.has(s.key);
            const tone = pct >= 70 ? "bg-ok-50 text-ok-700" : pct >= 50 ? "bg-warn-50 text-warn" : "bg-bad-50 text-bad";
            return (
              <div key={s.key} className="min-w-0">
                {showDay && (
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted"><span className="h-px flex-1 bg-line" />{dayLabel(s.rows[0].t)}<span className="h-px flex-1 bg-line" /></div>
                )}
                <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                  <button onClick={() => setClosed((c) => { const n = new Set(c); if (n.has(s.key)) n.delete(s.key); else n.add(s.key); return n; })} aria-expanded={open} className={`flex w-full items-center gap-3 border-t-4 px-5 py-3 text-left text-white ${s.source === "test" ? "border-black bg-ink" : "border-red-700 bg-red"}`}>
                    <IChevD className={`h-5 w-5 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="text-[16px] font-medium uppercase tracking-[0.02em]">{s.source === "test" ? "Practice test" : "Question bank"}</span>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium">{SECTION_LABEL[s.section]}</span>
                    <span className="ml-auto whitespace-nowrap text-[13px] text-white/85">{fmtTime(s.rows[0].t)} <span className="hidden sm:inline">({ago(s.rows[0].t, now)})</span></span>
                  </button>
                  <div className="eyebrow flex items-center justify-between gap-3 bg-ink px-5 py-1.5 text-white/90">
                    <span className="min-w-0 truncate">{domains.join(" · ")}</span>
                    <span className="shrink-0 whitespace-nowrap normal-case tracking-normal">{s.rows.length} question{s.rows.length === 1 ? "" : "s"}{ms > 0 && ` · ${fmtDuration(ms)}`}</span>
                  </div>
                  <div className={`flex items-end gap-4 px-5 py-4 ${tone}`}>
                    <div>
                      <p className="eyebrow text-ink">Correct</p>
                      <p className="text-[34px] leading-none font-medium tabular-nums text-ink">{ok}/{s.rows.length}</p>
                    </div>
                    <p className="pb-1 text-[15px] font-medium tabular-nums">{pct}%</p>
                  </div>
                  {open && (
                    <ul className="divide-y divide-line">
                      {s.rows.map((r, i) => (
                        <li key={`${r.id}-${i}`} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-5 py-3 text-sm xl:grid-cols-[110px_80px_150px_110px_minmax(0,1fr)_170px]">
                          <span>{r.correct ? <Badge tone="ok"><ICheckCircle className="mr-1 h-3.5 w-3.5" />Correct</Badge> : <Badge tone="bad"><IXCircle className="mr-1 h-3.5 w-3.5" />Incorrect</Badge>}</span>
                          <span className="text-xs text-muted xl:text-sm"><Badge tone={r.section === "math" ? "red" : "gold"}>{r.section === "math" ? "Math" : "R&W"}</Badge></span>
                          <span className="col-span-2 min-w-0 truncate xl:col-span-1"><span className="block truncate font-medium">{r.source === "test" ? "Practice test" : "Question bank"}</span><span className="block truncate text-xs text-muted">{r.skill}</span></span>
                          <button onClick={() => copy(r.id)} title="Copy a link to this question" className="w-fit rounded-md font-mono text-[13px] text-ink-2 hover:bg-surface-2">{copied === r.id ? "Copied!" : r.id}</button>
                          <Link prefetch={false} href={`/practice/play?ids=${r.id}&title=Review`} className="group col-span-2 flex min-w-0 items-center gap-1.5 xl:col-span-1">
                            <span className="min-w-0 truncate text-ink-2 group-hover:text-red">{r.preview}</span>
                            <IChevR className="h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                          <span className="col-span-2 text-xs text-muted xl:col-span-1 xl:text-sm">{fmtTime(r.t)} <span className="text-faint">({ago(r.t, now)})</span></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      )}
      {sessions.length > shown && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => setShown((n) => n + 25)}>Show more sessions ({sessions.length - shown} more)</Button>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-faint">
        {truncated ? `Showing your latest ${rows.length.toLocaleString()} of ${total.toLocaleString()} attempts` : `Showing all ${rows.length.toLocaleString()} attempt${rows.length === 1 ? "" : "s"}`}
        {filtered.length !== rows.length && ` · ${filtered.length.toLocaleString()} match your filters`}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------- page */

function SkillList({ items, empty, tone }: { items: SkillStat[]; empty: string; tone: "ok" | "bad" }) {
  if (!items.length) return <p className="mt-2 text-sm text-muted">{empty}</p>;
  return (
    <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2.5">
      {items.map((s) => (
        <li key={s.skill} className="min-w-0">
          <Link prefetch={false} href={`/practice/play?section=${s.section}&skill=${encodeURIComponent(s.skill)}&limit=0`} className="group flex min-w-0 items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate group-hover:text-red" title={s.skill}>{s.skill}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tone === "ok" ? "bg-ok-50 text-ok" : "bg-bad-50 text-bad"}`}>{Math.round(s.acc * 100)}%</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DiagnosticsView(p: Props) {
  const [now, setNow] = useState<number | null>(null);
  const [info, setInfo] = useState(false);
  useEffect(() => setNow(Date.now()), []);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-1.5 text-sm text-muted">
            Predicted Score
            <button onClick={() => setInfo((i) => !i)} aria-expanded={info} aria-label="How is this predicted?" className="grid h-4 w-4 place-items-center rounded-full border border-faint text-[10px] leading-none text-faint hover:text-ink">i</button>
          </div>
          {p.predicted ? (
            <>
              <p className="mt-2 text-[34px] leading-none font-medium text-red tabular-nums sm:text-[40px]">{p.predicted.total}</p>
              <p className="mt-2 text-xs text-muted tabular-nums">R&amp;W {p.predicted.rw} · Math {p.predicted.math}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[40px] leading-none font-medium text-faint">–</p>
              <div className="mt-3 grid gap-2">
                {(["rw", "math"] as const).map((k) => (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-xs text-muted"><span>{SECTION_LABEL[k]}</span><span className="tabular-nums">{Math.min(MIN_FOR_PREDICTION, p.seen[k])} / {MIN_FOR_PREDICTION}</span></div>
                    <Progress value={Math.min(1, p.seen[k] / MIN_FOR_PREDICTION)} tone="gold" className="h-1.5" />
                  </div>
                ))}
              </div>
            </>
          )}
          {info && <p className="mt-3 rounded-lg bg-surface p-2.5 text-xs text-ink-2">We take your latest answer to every question and turn your accuracy in each section into a score on one curve. It needs {MIN_FOR_PREDICTION} answers per section, and it&apos;s an estimate, not an official score.</p>}
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
          <p className="text-sm text-muted">Total Attempts</p>
          <p className="mt-2 text-[34px] leading-none font-medium tabular-nums sm:text-[40px]">{p.total.toLocaleString()}</p>
          <p className="mt-2 text-xs text-muted tabular-nums">Math: {p.split.math.toLocaleString()} <span className="text-faint">|</span> Reading &amp; Writing: {p.split.rw.toLocaleString()}</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-line bg-white p-4 shadow-card sm:col-span-1 sm:p-5">
          <p className="text-sm text-muted">Strongest Skills</p>
          <SkillList items={p.strongest} empty="No data yet. Answer 3 questions in a skill." tone="ok" />
        </div>

        <div className="col-span-2 rounded-2xl border border-line bg-white p-4 shadow-card sm:col-span-1 sm:p-5">
          <p className="text-sm text-muted">Weakest Skills</p>
          <SkillList items={p.weakest} empty="No data yet. Answer 3 questions in a skill." tone="bad" />
        </div>
      </div>

      {now !== null ? (
        <ProgressChart recs={p.recs} tests={p.tests} goal={p.goal} now={now} />
      ) : (
        <div className="h-[420px] animate-pulse rounded-2xl border border-line bg-white shadow-card" aria-hidden="true" />
      )}

      {now !== null ? <History rows={p.history} total={p.total} truncated={p.historyTruncated} now={now} /> : <div className="h-60 animate-pulse rounded-2xl border border-line bg-white shadow-card" aria-hidden="true" />}

    </div>
  );
}

/** Header button that opens the same calculator (lives in the page header, outside the grid). */
export function CalculatorButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg"><ICalc className="h-5 w-5" /> SAT Score Calculator</Button>
      <ScoreCalculator open={open} onClose={() => setOpen(false)} />
    </>
  );
}
