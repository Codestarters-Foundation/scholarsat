"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DailyPollData } from "@/lib/daily";
import { SECTION_LABEL, type Section } from "@/lib/types";
import { Passage } from "./QuestionBody";
import { Rich } from "./Rich";
import { ICheck, IChevD, IChevR } from "./icons";
import { SubjectArt } from "./ui";

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
  const [open, setOpen] = useState<Section | null>(null);
  const section: Section = open ?? "math";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const p = data[section];
  const q = p.question;
  const countdown = useCountdown(p.resetsAt);
  const dayNo = p.day - 20400;
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
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {(["math", "rw"] as Section[]).map((sec) => {
          const d = data[sec];
          const on = open === sec;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setOpen(on ? null : sec)}
              aria-expanded={on}
              className={`group relative flex h-40 flex-col justify-between overflow-hidden rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${sec === "math" ? "bg-red-50 text-red" : "bg-gold-50 text-gold-600"} ${on ? "ring-2 ring-current" : ""}`}
            >
              <SubjectArt kind={sec} className="pointer-events-none absolute -right-6 -top-8 h-56 w-56 transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105" />
              <div className="relative">
                <p className="eyebrow opacity-80">Daily #{dayNo}</p>
                <p className="mt-1 text-[20px] font-medium text-ink">{SECTION_LABEL[sec]}</p>
              </div>
              <div className="relative flex items-end justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  {d.mine !== null && <ICheck className="h-4 w-4 text-ok-500" />}
                  {d.mine !== null ? "Voted" : "Click for more"}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium tabular-nums">
                  {d.total.toLocaleString()} {d.total === 1 ? "vote" : "votes"}
                  {on ? <IChevD className="h-4 w-4" /> : <IChevR className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="px-5 pb-3 text-xs text-muted">New question in <span className="font-medium tabular-nums text-ink">{countdown || "…"}</span></p>

      {open && (
      <div className="animate-rise border-t border-line">
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
      )}
    </div>
  );
}
