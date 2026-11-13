"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DailyPollData } from "@/lib/daily";
import { SECTION_LABEL, type Section } from "@/lib/types";
import { Passage } from "./QuestionBody";
import { Rich } from "./Rich";
import { ICheck } from "./icons";

const L = ["A", "B", "C", "D"];

function useCountdown(resetsAt: number) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const l = resetsAt - Date.now();
      setLeft(Math.max(0, l));
      if (l <= 0) router.refresh();
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [resetsAt, router]);
  if (left === null) return "";
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Today's question as a poll: pick an answer, then see what everyone else picked. The answer is never shown. */
export function DailyPoll({ polls }: { polls: Record<Section, DailyPollData> }) {
  const [data, setData] = useState(polls);
  const [section, setSection] = useState<Section>("math");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const p = data[section];
  const q = p.question;
  const countdown = useCountdown(p.resetsAt);
  const voted = p.mine !== null;
  const split = !!(q.passage || q.table);

  const vote = async (choice: string) => {
    if (voted || busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/daily", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ section, choice }) });
    if (r.ok) {
      const next = (await r.json()) as DailyPollData;
      setData((d) => ({ ...d, [section]: next }));
    } else setErr("Couldn't save your vote. Try again.");
    setBusy(false);
  };

  const top = Math.max(...L.map((l) => p.counts[l] ?? 0));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 pt-3 sm:px-5">
        <div className="flex gap-1" role="tablist" aria-label="Section">
          {(["math", "rw"] as Section[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={section === s}
              onClick={() => setSection(s)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${section === s ? "border-red text-red" : "border-transparent text-muted hover:text-ink"}`}
            >
              {SECTION_LABEL[s]}
              {data[s].mine !== null && <ICheck className="ml-1.5 inline h-3.5 w-3.5 text-ok-500" />}
            </button>
          ))}
        </div>
        <p className="pb-2 text-xs text-muted">New question in <span className="font-medium tabular-nums text-ink">{countdown || "…"}</span></p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="eyebrow text-muted">{q.skill}</p>
        {split && (
          <div className="scroll-thin mt-3 max-h-56 overflow-y-auto rounded-xl bg-surface p-4 text-[15px]">
            <Passage q={q} />
          </div>
        )}
        <Rich text={q.stem} className="mt-3 text-[16px] text-ink" />

        <div className="mt-4 grid gap-2.5">
          {(q.choices ?? []).map((c, i) => {
            const l = L[i];
            const n = p.counts[l] ?? 0;
            const pct = p.total ? Math.round((n / p.total) * 100) : 0;
            const mine = p.mine === l;
            const leading = voted && n === top && n > 0;
            return (
              <button
                key={l}
                type="button"
                disabled={voted || busy}
                onClick={() => vote(l)}
                aria-pressed={mine}
                className={`group relative flex min-h-[52px] w-full items-center gap-3 overflow-hidden rounded-xl border-2 px-3.5 py-2.5 text-left transition-colors ${
                  mine ? "border-red bg-red-50" : voted ? "border-line bg-white" : "border-line-strong bg-white hover:border-red-200 hover:bg-red-50/40"
                }`}
              >
                {voted && <span className={`absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${mine ? "bg-red/15" : "bg-surface-2"}`} style={{ width: `${pct}%` }} aria-hidden="true" />}
                <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[13px] font-medium ${mine ? "border-red bg-red text-white" : "border-ink/60"}`}>{l}</span>
                <Rich text={c} className="relative min-w-0 flex-1 text-[15px]" />
                {voted && (
                  <span className="relative shrink-0 text-right">
                    <span className={`block text-[15px] font-medium tabular-nums ${leading ? "text-red" : "text-ink-2"}`}>{pct}%</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-muted" role="status">
          {err ? <span className="text-bad">{err}</span> : voted ? <>You picked <span className="font-medium text-ink">{p.mine}</span>. {p.total.toLocaleString()} {p.total === 1 ? "person has" : "people have"} voted. The answer isn&apos;t revealed. Work it out and see if you agree with the crowd.</> : "Pick an answer to see what everyone else chose. No peeking at the answer."}
        </p>
      </div>
    </div>
  );
}
