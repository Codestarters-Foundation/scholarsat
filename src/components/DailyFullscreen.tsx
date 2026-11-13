"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DailyPollData } from "@/lib/daily";
import { SECTION_LABEL, type Section } from "@/lib/types";
import { Choices, Passage } from "./QuestionBody";
import { DESMOS_URL, ReferenceSheet, ToolButton } from "./MathTools";
import { Rich } from "./Rich";
import { Logo } from "./Logo";
import { Owl } from "./Owl";
import { Button, DiffBadge, LinkButton } from "./ui";
import { ICalc, ICheck, IFormula, IList, IX } from "./icons";

function useCountdown(resetsAt: number) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, resetsAt - Date.now()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [resetsAt]);
  if (left === null) return "";
  const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** The daily question as a full-screen poll: pick an answer, vote, see what everyone else picked. Never shows the answer. */
export function DailyFullscreen({ initial, section, dayNo }: { initial: Record<Section, DailyPollData>; section: Section; dayNo: number }) {
  const [data, setData] = useState(initial);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [refOpen, setRefOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const p = data[section];
  const q = p.question;
  const voted = p.mine !== null;
  const countdown = useCountdown(p.resetsAt);
  const split = !!(q.passage || q.table);
  const other: Section = section === "math" ? "rw" : "math";

  const vote = async () => {
    if (!pick || voted || busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/daily", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ section, choice: pick }) });
    if (r.ok) {
      const next = (await r.json()) as DailyPollData;
      setData((d) => ({ ...d, [section]: next }));
    } else setErr("Couldn't save your vote. Try again.");
    setBusy(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (voted) return;
      const map: Record<string, string> = { a: "A", b: "B", c: "C", d: "D", "1": "A", "2": "B", "3": "C", "4": "D" };
      if (map[e.key.toLowerCase()]) setPick(map[e.key.toLowerCase()]);
      else if (e.key === "Enter") vote();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const list = (
    <ul className="grid gap-1 p-3">
      {(["math", "rw"] as Section[]).map((s) => {
        const d = data[s];
        const active = s === section;
        return (
          <li key={s}>
            <Link href={`/daily/${s}`} onClick={() => setListOpen(false)} aria-current={active ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-colors ${active ? "border-red-200 bg-red-50" : "border-transparent hover:bg-surface-2"}`}>
              <span className={`whitespace-nowrap text-[15px] ${active ? "font-medium text-red" : "text-ink-2"}`}>{SECTION_LABEL[s]}</span>
              <span className="ml-auto flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                {d.mine !== null ? <><ICheck className="h-4 w-4 text-ok-500" /> Voted</> : "Not voted"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="fixed inset-0 z-40 flex bg-white">
      <aside className={`${listOpen ? "fixed inset-y-0 left-0 z-50 flex shadow-pop" : "hidden"} w-[256px] shrink-0 flex-col border-r border-line bg-white lg:static lg:flex lg:shadow-none`}>
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <Logo href="/dashboard" size={36} />
          <button className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden" onClick={() => setListOpen(false)} aria-label="Close list"><IX className="h-4 w-4" /></button>
        </div>
        <div className="px-5 pt-4">
          <p className="text-[17px] font-medium">Daily #{dayNo}</p>
          <div className="mt-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
            New questions in <span className="font-medium tabular-nums text-ink">{countdown || "…"}</span>
          </div>
        </div>
        <nav className="mt-3 flex-1 border-t border-line" aria-label="Daily questions">{list}</nav>
        <div className="border-t border-line p-3">
          <LinkButton href="/dashboard" className="w-full text-[13px] tracking-[0.08em] uppercase">Exit daily</LinkButton>
        </div>
      </aside>
      {listOpen && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setListOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center gap-2 border-b-4 border-red-700 bg-red px-2 text-white sm:h-[68px] sm:gap-3 sm:px-5">
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setListOpen(true)} aria-label="Show daily questions"><IList /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">Daily Question #{dayNo} · {SECTION_LABEL[section]}</p>
            <p className="truncate text-xs text-white/75">{q.skill}</p>
          </div>
          <span className="hidden text-sm text-white/85 sm:block">New in <span className="font-mono tabular-nums">{countdown || "…"}</span></span>
          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:flex-1">
            {section === "math" && (
              <>
                <ToolButton icon={<IFormula className="h-5 w-5" />} label="Reference" onClick={() => setRefOpen((o) => !o)} active={refOpen} />
                <ToolButton icon={<ICalc className="h-5 w-5" />} label="Calculator" href={DESMOS_URL} />
              </>
            )}
          </div>
        </header>
        <div className="eyebrow shrink-0 bg-ink py-1 text-center text-white/90">ScholarSAT daily poll</div>

        <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <section className="scroll-thin border-b border-line px-6 py-7 lg:w-1/2 lg:overflow-y-auto lg:border-b-0 lg:border-r-4 lg:border-r-surface-2 lg:px-9 lg:py-9" aria-label={split ? "Passage" : "Question"}>
            <div className="mx-auto w-full max-w-[720px]">{split ? <Passage q={q} /> : <Rich text={q.stem} className="text-[18px] text-ink" />}</div>
          </section>
          <section className="scroll-thin px-6 py-7 lg:w-1/2 lg:overflow-y-auto lg:px-9 lg:py-9" aria-label="Answer">
            <div className="mb-5 flex items-center gap-3 border-b border-line bg-surface pr-3">
              <span className="grid h-11 w-11 place-items-center bg-ink text-[17px] font-medium text-white">#{dayNo % 100}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted">{q.skill}</span>
              <DiffBadge d={q.difficulty} />
            </div>
            {split && <Rich text={q.stem} className="mb-5 text-[17px] text-ink" />}
            <Choices
              q={q}
              selected={voted ? (p.mine as string) : pick}
              onSelect={setPick}
              disabled={voted}
              reveal={voted ? { answer: null, dist: p.counts } : null}
            />
            <div className={`mt-6 animate-rise rounded-2xl border-2 p-5 ${voted ? "border-line bg-surface" : "hidden"}`} role="status">
              <div className="flex items-center gap-3">
                <Owl size={40} mood="idle" />
                <div>
                  <p className="text-[16px] font-medium">You picked {p.mine}. {p.total.toLocaleString()} {p.total === 1 ? "person has" : "people have"} voted.</p>
                  <p className="text-sm text-muted">The answer isn&apos;t revealed. Work it out and see whether you agree with the crowd.</p>
                </div>
              </div>
            </div>
            {err && <p role="alert" className="mt-4 text-sm text-bad">{err}</p>}
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <p className="hidden text-xs text-muted md:block">{voted ? "Come back tomorrow for a new question." : "A–D to choose · Enter to vote"}</p>
          <div className="ml-auto flex items-center gap-2">
            {voted ? (
              <>
                <LinkButton href={`/daily/${other}`} variant="secondary">{SECTION_LABEL[other]}</LinkButton>
                <LinkButton href="/dashboard" variant="success">Done</LinkButton>
              </>
            ) : (
              <Button variant="success" onClick={vote} disabled={!pick || busy}>{busy ? "Voting…" : "Vote"}</Button>
            )}
          </div>
        </footer>
      </div>
      {refOpen && <ReferenceSheet onClose={() => setRefOpen(false)} />}
    </div>
  );
}
