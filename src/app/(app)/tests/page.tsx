import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LinkButton, PageTitle } from "@/components/ui";
import { StartTestButton } from "@/components/StartTestButton";
import { Owl } from "@/components/Owl";
import { IClock, IExam, ISparkle } from "@/components/icons";

export const metadata: Metadata = { title: "Practice Tests" };

type Row = { id: number; started_at: number; finished_at: number | null; score_rw: number | null; score_math: number | null };

export default async function Tests() {
  const user = await getUser();
  const rows = user ? (db.prepare("SELECT id, started_at, finished_at, score_rw, score_math FROM tests WHERE user_id = ? ORDER BY id DESC").all(user.id) as Row[]) : [];
  const best = rows.filter((r) => r.finished_at).reduce((m, r) => Math.max(m, (r.score_rw ?? 0) + (r.score_math ?? 0)), 0);

  return (
    <div className="animate-rise">
      <PageTitle title="Practice Tests" sub="Full-length, timed, and adaptive, structured like the digital SAT." />

      {/* Hero */}
      <section className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow text-red">Full-length mock exam</p>
            <h2 className="mt-1 text-[26px] leading-tight font-medium">2 hours 14 minutes · 98 questions</h2>
            <div className="mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
              {[
                ["Reading and Writing", "2 modules · 27 questions · 32 min each"],
                ["Math", "2 modules · 22 questions · 35 min each"],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-line bg-surface p-4">
                  <p className="font-medium">{t}</p>
                  <p className="mt-0.5 text-sm text-muted">{d}</p>
                </div>
              ))}
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-1.5"><ISparkle className="h-4 w-4 text-gold" /> Module 2 adapts to module 1</li>
              <li className="flex items-center gap-1.5"><IExam className="h-4 w-4 text-gold" /> 400–1600 score report</li>
              <li className="flex items-center gap-1.5"><IClock className="h-4 w-4 text-gold" /> Saves automatically</li>
            </ul>
            <div className="mt-6">{user ? <StartTestButton /> : <LinkButton href="/signup" size="lg">Create a free account to take a test</LinkButton>}</div>
          </div>
          <div className="hidden justify-center lg:flex lg:pr-6"><Owl size={150} /></div>
        </div>
      </section>

      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="text-[20px] font-medium">Your tests</h2>
        {best > 0 && <p className="text-sm text-muted">Best score <span className="ml-1 font-medium text-red tabular-nums">{best}</span></p>}
      </div>

      {rows.length ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((t, n) => {
            const total = (t.score_rw ?? 0) + (t.score_math ?? 0);
            const done = !!t.finished_at;
            return (
              <article key={t.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <div className={`px-5 pb-2 pt-4 ${done ? "bg-red-50" : "bg-gold-50"}`}>
                  <p className={`text-[30px] leading-none font-medium tracking-tight ${done ? "text-red" : "text-gold-600"}`}>TEST {rows.length - n}</p>
                </div>
                <p className="eyebrow bg-surface-2 px-5 py-1 text-muted">SAT mock exam · {new Date(t.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                <div className="p-5">
                  <p className="eyebrow text-center text-faint">Your total score</p>
                  <p className={`mt-1 text-center text-[44px] leading-none font-medium tabular-nums ${done ? "text-ink" : "text-faint"}`}>{done ? total : "–"}</p>
                  <p className="mt-1 text-center text-xs text-faint">400–1600</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-line px-3 py-2"><p className="text-xs text-muted">Reading &amp; Writing</p><p className="font-medium tabular-nums">{done ? t.score_rw : "–"}</p></div>
                    <div className="rounded-lg border border-line px-3 py-2"><p className="text-xs text-muted">Math</p><p className="font-medium tabular-nums">{done ? t.score_math : "–"}</p></div>
                  </div>
                  {done ? (
                    <LinkButton href={`/tests/${t.id}/report`} variant="secondary" className="mt-4 w-full">View score report</LinkButton>
                  ) : (
                    <LinkButton href={`/tests/${t.id}`} variant="gold" className="mt-4 w-full">Resume test</LinkButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-line-strong bg-white/60 px-6 py-10 text-center text-sm text-muted">No tests yet. Your scores will show up here.</div>
      )}

      <p className="mt-8 text-xs text-muted">
        Want the official tests too? College Board&apos;s full-length practice tests are free in the{" "}
        <Link className="font-medium text-red hover:underline" href="https://bluebook.collegeboard.org/" target="_blank" rel="noopener noreferrer">Bluebook app</Link>.
      </p>
    </div>
  );
}
