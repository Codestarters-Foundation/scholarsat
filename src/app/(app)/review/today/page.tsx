import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { BY_ID } from "@/lib/bank";
import { db } from "@/lib/db";
import { MISS_REASONS } from "@/lib/miss-reasons";
import { loadSchedule, reasonCounts } from "@/lib/miss-store";
import { LADDER_DAYS, whenLabel } from "@/lib/missed-loop";
import { SECTION_LABEL } from "@/lib/types";
import { DiffBadge, EmptyState, HeaderCard, LinkButton, PageTitle } from "@/components/ui";
import { IChevR, IRefresh } from "@/components/icons";

export const metadata: Metadata = { title: "Due today" };

export default async function DueToday() {
  const user = await requireUser();
  const now = Date.now();
  const s = loadSchedule(db, user.id, now, (id) => BY_ID.has(id));
  const why = reasonCounts(db, user.id, now);
  const step = (n: number) => `Step ${n + 1} of ${LADDER_DAYS.length}`;

  const row = (id: string, right: string) => {
    const q = BY_ID.get(id)!;
    return (
      <li key={id}>
        <Link href={`/practice/play?ids=${id}&title=${encodeURIComponent("Review")}`} className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium group-hover:text-red">{q.skill}</p>
            <p className="text-xs text-muted">{SECTION_LABEL[q.section]} · {q.domain}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted">{right}</span>
            <DiffBadge d={q.difficulty} />
            <IChevR className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </li>
    );
  };

  return (
    <div className="animate-rise">
      <PageTitle title="Due today" sub={`Missed questions come back after ${LADDER_DAYS.join(", ").replace(/, (\d+)$/, " and $1")} days. Get one right when it is due and it moves up a step. Three in a row and it graduates.`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-6">
          <HeaderCard
            title={<>Due now <span className="ml-1 text-white/75 tabular-nums">{s.due.length}</span></>}
            right={s.due.length > 0 && <LinkButton size="sm" variant="secondary" href={`/practice/play?ids=${s.due.slice(0, 20).map((d) => d.id).join(",")}&title=${encodeURIComponent("Due today")}`}>Start review</LinkButton>}
            bodyClassName=""
          >
            {s.due.length ? (
              <ul className="divide-y divide-line">{s.due.slice(0, 50).map((d) => row(d.id, step(d.step)))}</ul>
            ) : (
              <EmptyState icon={<IRefresh />} title={s.learning ? "You're caught up" : "Nothing to review yet"}>
                {s.learning ? `Your next review is ${whenLabel(s.upcoming[0].dueAt, now)}.` : "Questions you miss show up here on a schedule that helps them stick."}
              </EmptyState>
            )}
          </HeaderCard>
          {s.upcoming.length > 0 && (
            <HeaderCard tone="gold" title={<>Coming up <span className="ml-1 text-white/75 tabular-nums">{s.upcoming.length}</span></>} bodyClassName="">
              <ul className="divide-y divide-line">{s.upcoming.slice(0, 30).map((d) => row(d.id, whenLabel(d.dueAt, now)))}</ul>
            </HeaderCard>
          )}
        </div>
        <div className="grid content-start gap-6">
          <section className="rounded-2xl border border-line bg-bg p-5 shadow-card">
            <p className="text-[17px] font-medium text-ink">Your ladder</p>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-surface-2 py-3"><dt className="text-xs text-muted">Due</dt><dd className="text-xl tabular-nums">{s.due.length}</dd></div>
              <div className="rounded-xl bg-surface-2 py-3"><dt className="text-xs text-muted">Coming up</dt><dd className="text-xl tabular-nums">{s.upcoming.length}</dd></div>
              <div className="rounded-xl bg-surface-2 py-3"><dt className="text-xs text-muted">Graduated</dt><dd className="text-xl tabular-nums">{s.graduated}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl border border-line bg-bg p-5 shadow-card">
            <p className="text-[17px] font-medium text-ink">Why you miss questions</p>
            <p className="text-xs text-muted">Last 60 days · {why.total} missed</p>
            {why.total === 0 ? (
              <p className="mt-3 text-sm text-ink-2">Nothing missed lately. After a wrong answer you can tap a reason, and the pattern shows up here.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {MISS_REASONS.map((r) => {
                  const n = why.counts[r.id];
                  return (
                    <li key={r.id}>
                      <div className="flex justify-between text-sm"><span>{r.label}</span><span className="tabular-nums text-muted">{n}</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-strong"><div className="h-full rounded-full bg-red" style={{ width: `${(n / why.total) * 100}%` }} /></div>
                    </li>
                  );
                })}
                {why.untagged > 0 && <li className="text-xs text-muted">{why.untagged} without a reason</li>}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
