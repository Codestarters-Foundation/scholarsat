"use client";
import { useEffect, useState } from "react";
import type { DailyPollData } from "@/lib/daily";
import type { DailyReveal } from "@/lib/daily-answer";
import { SECTION_LABEL, type Section } from "@/lib/types";
import { Rich } from "../Rich";
import { Badge, Button, HeaderCard } from "../ui";
import { ICheckCircle, IXCircle } from "../icons";

const SECTIONS: Section[] = ["math", "rw"];
const LETTERS = ["A", "B", "C", "D"];

type Props = {
  polls: Record<Section, DailyPollData>;
  reveals: Record<Section, DailyReveal | null>;
};

/** Today's daily questions on the Diagnostics page: pick an answer, submit it, then see the correct
 *  answer, the explanation and what everyone else picked. The answer is only sent after you vote. */
export function DailyAnswerCard({ polls, reveals }: Props) {
  const [tab, setTab] = useState<Section>("math");
  const [pollState, setPolls] = useState(polls);
  const [revealState, setReveals] = useState(reveals);
  const [picks, setPicks] = useState<Record<Section, string>>({ math: "", rw: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Read the clock after mount so server and client render the same HTML.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const poll = pollState[tab];
  const reveal = revealState[tab];
  const q = poll.question;
  const voted = poll.mine !== null;
  const pick = voted ? (poll.mine ?? "") : picks[tab];

  const submit = async () => {
    if (!pick || voted || busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/daily/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ section: tab, choice: pick }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const data = (await r.json()) as { poll: DailyPollData; reveal: DailyReveal | null };
      setPolls((p) => ({ ...p, [tab]: data.poll }));
      setReveals((p) => ({ ...p, [tab]: data.reveal }));
    } catch {
      setErr("Couldn't save your answer. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const choices = q.choices ?? [];
  const showPassage = !!(q.passage || q.passage2 || q.table);

  return (
    <HeaderCard
      tone="gold"
      title="Today's daily questions"
      right={now !== null && <span>New ones in {Math.max(1, Math.ceil((poll.resetsAt - now) / 3600000))}h</span>}
      bodyClassName="p-5"
    >
      <div role="tablist" aria-label="Daily question section" className="inline-flex gap-1 rounded-xl bg-surface-2 p-1">
        {SECTIONS.map((s) => {
          const done = pollState[s].mine !== null;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={tab === s}
              onClick={() => { setTab(s); setErr(""); }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${tab === s ? "bg-bg text-ink shadow-xs" : "text-muted hover:text-ink"}`}
            >
              {SECTION_LABEL[s]}
              {done && <ICheckCircle className="h-4 w-4 text-ok-500" />}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4" role="tabpanel">
        {showPassage && (
          <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 text-[15px] leading-relaxed text-ink">
            {q.passage && <Rich text={q.passage} />}
            {q.passage2 && <Rich text={q.passage2} />}
            {q.table && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  {q.table.caption && <caption className="pb-2 text-left text-xs text-muted">{q.table.caption}</caption>}
                  <thead>
                    <tr>{q.table.headers.map((h) => <th key={h} className="border-b border-line px-2 py-1.5 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {q.table.rows.map((row, i) => (
                      <tr key={i}>{row.map((c, j) => <td key={j} className="border-b border-line px-2 py-1.5 tabular-nums">{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="text-[15px] font-medium text-ink"><Rich text={q.stem} /></div>

        <fieldset className="grid gap-2.5" disabled={voted || busy}>
          <legend className="sr-only">Answer choices</legend>
          {choices.map((c, i) => {
            const L = LETTERS[i];
            const isMine = voted && poll.mine === L;
            const isRight = !!reveal && reveal.answer === L;
            const pct = poll.total > 0 ? Math.round((poll.counts[L] / poll.total) * 100) : 0;
            let tone = "border-line bg-bg hover:border-red-200 hover:bg-red-50/40";
            if (!voted && pick === L) tone = "border-red bg-red-50";
            if (reveal) {
              if (isRight) tone = "border-ok bg-ok-50";
              else if (isMine) tone = "border-bad bg-bad-50";
              else tone = "border-line bg-bg opacity-70";
            } else if (voted) tone = "border-line bg-surface";
            return (
              <label key={L} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 text-[15px] transition-colors focus-within:ring-2 focus-within:ring-red/30 has-[:disabled]:cursor-default ${tone}`}>
                <input
                  type="radio"
                  className="sr-only"
                  name={`daily-${tab}`}
                  value={L}
                  checked={pick === L}
                  onChange={() => setPicks((p) => ({ ...p, [tab]: L }))}
                />
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-bg text-xs font-medium">{L}</span>
                <span className="min-w-0 flex-1 text-ink"><Rich text={c} /></span>
                {reveal && isRight && <ICheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-ok-500" />}
                {reveal && isMine && !isRight && <IXCircle className="mt-0.5 h-5 w-5 shrink-0 text-bad" />}
                {voted && <span className="mt-0.5 shrink-0 text-xs tabular-nums text-muted">{pct}%</span>}
              </label>
            );
          })}
        </fieldset>

        {!voted && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={!pick || busy}>{busy ? "Saving…" : "Submit answer"}</Button>
            <span className="text-xs text-muted">Your first answer is final. The correct answer shows after you submit.</span>
          </div>
        )}
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}

        {reveal && (
          <div className="rounded-xl border border-line bg-surface p-4" role="status">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={reveal.correct ? "ok" : "bad"}>{reveal.correct ? "Correct" : "Not quite"}</Badge>
              <span className="text-sm font-medium text-ink">The answer is {reveal.answer}.</span>
              <span className="ml-auto text-xs text-muted tabular-nums">{poll.total.toLocaleString()} {poll.total === 1 ? "person" : "people"} answered</span>
            </div>
            <div className="mt-3 text-[15px] leading-relaxed text-ink"><Rich text={reveal.explanation} /></div>
          </div>
        )}
      </div>
    </HeaderCard>
  );
}
