import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, LinkButton, PageTitle, Badge } from "@/components/ui";
import { StartTestButton } from "@/components/StartTestButton";

export const metadata: Metadata = { title: "Practice Tests" };

export default async function Tests() {
  const user = await getUser();
  const rows = user
    ? (db.prepare("SELECT id, started_at, finished_at, score_rw, score_math FROM tests WHERE user_id = ? ORDER BY id DESC").all(user.id) as { id: number; started_at: number; finished_at: number | null; score_rw: number | null; score_math: number | null }[])
    : [];
  return (
    <>
      <PageTitle title="Practice Tests" sub="Full-length, timed, and adaptive, structured like the digital SAT." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6 sm:p-8">
          <Badge tone="gold">Full-length mock test</Badge>
          <h2 className="mt-3 font-display text-2xl font-semibold">2 hours 14 minutes · 98 questions</h2>
          <ul className="mt-4 grid gap-3 text-sm text-ink sm:grid-cols-2">
            <li className="rounded-xl bg-surface p-4"><p className="font-semibold">Reading and Writing</p><p className="text-muted">2 modules · 27 questions · 32 minutes each</p></li>
            <li className="rounded-xl bg-surface p-4"><p className="font-semibold">Math</p><p className="text-muted">2 modules · 22 questions · 35 minutes each</p></li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Like the real test, the second module of each section adapts to how you did on the first. You get a score report with an
            estimated 400–1600 score and a full answer review. Your progress saves automatically, so you can close the tab and resume.
          </p>
          <div className="mt-6">
            {user ? <StartTestButton /> : <LinkButton href="/signup">Create a free account to take a test</LinkButton>}
          </div>
          <p className="mt-4 text-xs text-muted">
            Want the official tests too? College Board&apos;s full-length practice tests are free in the{" "}
            <a className="font-semibold text-red hover:underline" href="https://bluebook.collegeboard.org/" target="_blank" rel="noopener noreferrer">Bluebook app</a>.
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Your tests</h2>
          {rows.length ? (
            <ul className="mt-3 divide-y divide-line">
              {rows.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold">Test #{t.id}</p>
                    <p className="text-xs text-muted">{new Date(t.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  {t.finished_at ? (
                    <Link href={`/tests/${t.id}/report`} className="font-display text-xl font-semibold text-red hover:underline">{(t.score_rw ?? 0) + (t.score_math ?? 0)}</Link>
                  ) : (
                    <Link href={`/tests/${t.id}`} className="rounded-lg bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-600 hover:bg-gold-100">Resume</Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No tests yet. Your scores will show up here.</p>
          )}
        </Card>
      </div>
    </>
  );
}
