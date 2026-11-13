import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { moduleCorrect, type TestState } from "@/lib/tests";
import { LinkButton, PageTitle } from "@/components/ui";
import { StartTestButton } from "@/components/StartTestButton";

export const metadata: Metadata = { title: "Practice Tests" };

type Row = { id: number; state: string; started_at: number; finished_at: number | null; score_rw: number | null; score_math: number | null };

const MIN_SLOTS = 8;

function ModPill({ n, correct, total }: { n: number; correct: number; total: number }) {
  return (
    <span className="flex flex-1 items-center justify-between rounded-lg bg-red-50 px-2.5 py-1.5 text-[12px] text-red">
      <span className="font-medium">Mod {n}</span>
      <span className="tabular-nums">{total ? `${correct}/${total}` : "–"}</span>
    </span>
  );
}

export default async function Tests() {
  const user = await getUser();
  const rows = user ? (db.prepare("SELECT id, state, started_at, finished_at, score_rw, score_math FROM tests WHERE user_id = ? ORDER BY id ASC").all(user.id) as Row[]) : [];
  const slots = Math.max(MIN_SLOTS, rows.length + (rows.length % 4 === 0 ? 4 : 4 - (rows.length % 4)));

  return (
    <div className="animate-rise">
      <PageTitle
        title="Practice Tests"
        sub="Full-length SAT mock exams to track your progress. 2 hours 14 minutes, 98 questions, and module 2 adapts to how you do on module 1."
        action={user ? <StartTestButton label="New test" /> : <LinkButton href="/signup" size="lg">Create a free account</LinkButton>}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: slots }, (_, i) => {
          const t = rows[i];
          const n = i + 1;
          if (!t) {
            return (
              <article key={`empty-${n}`} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <div className="bg-red-50 px-5 pb-2 pt-4"><p className="text-[30px] leading-none font-medium tracking-tight text-red/40">TEST {n}</p></div>
                <p className="eyebrow bg-surface-2 px-5 py-1 text-muted">SAT mock exam</p>
                <div className="p-5">
                  <p className="eyebrow text-center text-faint">Your total score</p>
                  <p className="mt-1 text-center text-[44px] leading-none font-medium text-faint">–</p>
                  <p className="mt-1 text-center text-xs text-faint">400–1600</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div><div className="flex justify-between text-faint"><span>Reading and Writing</span><span className="text-xs">200–800</span></div><div className="mt-1.5 flex gap-2"><ModPill n={1} correct={0} total={0} /><ModPill n={2} correct={0} total={0} /></div></div>
                    <div><div className="flex justify-between text-faint"><span>Math</span><span className="text-xs">200–800</span></div><div className="mt-1.5 flex gap-2"><ModPill n={1} correct={0} total={0} /><ModPill n={2} correct={0} total={0} /></div></div>
                  </div>
                  <div className="mt-4">
                    {user ? <StartTestButton label="Start test" size="md" className="w-full uppercase tracking-[0.06em]" /> : <LinkButton href="/signup" className="w-full uppercase tracking-[0.06em]">Sign up to start</LinkButton>}
                  </div>
                </div>
              </article>
            );
          }
          const state = JSON.parse(t.state) as TestState;
          const mc = moduleCorrect(state);
          const done = !!t.finished_at;
          const total = (t.score_rw ?? 0) + (t.score_math ?? 0);
          return (
            <article key={t.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className={`border-t-4 px-5 pb-2 pt-3 ${done ? "border-red-700 bg-red" : "border-gold-700 bg-gold"}`}>
                <p className="text-[30px] leading-none font-medium tracking-tight text-white">TEST {n}</p>
              </div>
              <p className="eyebrow flex justify-between bg-ink px-5 py-1 text-white/90">
                <span>SAT mock exam</span>
                <span>{new Date(t.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </p>
              <div className="p-5">
                <p className="eyebrow text-center text-muted">Your total score</p>
                <p className={`mt-1 text-center text-[44px] leading-none font-medium tabular-nums ${done ? "text-ink" : "text-faint"}`}>{done ? total : "–"}</p>
                <p className="mt-1 text-center text-xs text-faint">400–1600</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <div>
                    <div className="flex items-baseline justify-between"><span className="font-medium">Reading and Writing</span><span className="font-medium tabular-nums">{done ? t.score_rw : "–"}</span></div>
                    <div className="mt-1.5 flex gap-2"><ModPill n={1} {...mc[0]} /><ModPill n={2} {...mc[1]} /></div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between"><span className="font-medium">Math</span><span className="font-medium tabular-nums">{done ? t.score_math : "–"}</span></div>
                    <div className="mt-1.5 flex gap-2"><ModPill n={1} {...mc[2]} /><ModPill n={2} {...mc[3]} /></div>
                  </div>
                </div>
                <div className="mt-4">
                  {done ? (
                    <LinkButton href={`/tests/${t.id}/report`} className="w-full uppercase tracking-[0.06em]">Review test</LinkButton>
                  ) : (
                    <LinkButton href={`/tests/${t.id}`} variant="gold" className="w-full uppercase tracking-[0.06em]">Resume test</LinkButton>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted">
        Want the official tests too? College Board&apos;s full-length practice tests are free in the{" "}
        <Link className="font-medium text-red hover:underline" href="https://bluebook.collegeboard.org/" target="_blank" rel="noopener noreferrer">Bluebook app</Link>.
      </p>
    </div>
  );
}
