import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MODULES, moduleCorrect, type TestState } from "@/lib/tests";
import { LinkButton, PageTitle } from "@/components/ui";
import { StartTestButton } from "@/components/StartTestButton";

export const metadata: Metadata = { title: "Practice Tests" };
type Row = { id: number; state: string; started_at: number; finished_at: number | null; score_rw: number | null; score_math: number | null };

export default async function Tests() {
  const user = await getUser();
  const rows = user ? db.prepare("SELECT id, state, started_at, finished_at, score_rw, score_math FROM tests WHERE user_id = ? ORDER BY id ASC").all(user.id) as Row[] : [];
  return <div className="exam-program">
    <PageTitle title="Practice tests" sub="Take a timed SAT mock exam. Your first module in each subject determines the difficulty of the second."
      action={user ? <StartTestButton label="Start a new test" /> : <LinkButton href="/signup" size="lg">Sign up to start</LinkButton>} />
    <section aria-label="Exam schedule">
      <h2>Test schedule</h2>
      <p>98 questions · 2 hours 14 minutes of testing</p>
      <ol>{MODULES.map((m,i) => <li key={i}>
        <span>{m.section === "rw" ? "Reading and Writing" : "Math"}</span>
        <span>Module {i%2+1}</span><span>{m.n} questions</span><strong>{m.minutes} min</strong>
      </li>)}</ol>
    </section>
    {rows.length > 0 && <section aria-label="Your tests"><h2>Your tests</h2>
      {rows.map((t,i) => {
        const scores = moduleCorrect(JSON.parse(t.state) as TestState);
        return <article className="test-record" key={t.id}>
          <header><h3>Test {i+1}</h3><time dateTime={new Date(t.started_at).toISOString()}>{new Date(t.started_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</time></header>
          <p>{t.finished_at ? `Total ${(t.score_rw ?? 0)+(t.score_math ?? 0)} · Reading and Writing ${t.score_rw} · Math ${t.score_math}` : "In progress"}</p>
          <details><summary>Module results</summary>{scores.map((score,m) => <p key={m}>{MODULES[m].section === "rw" ? "Reading and Writing" : "Math"} · Module {m%2+1} · {score.correct}/{score.total} correct</p>)}</details>
          <Link className="record-link" href={t.finished_at ? `/tests/${t.id}/report` : `/tests/${t.id}`}>{t.finished_at ? "Review test" : "Resume test"} →</Link>
        </article>;
      })}
    </section>}
    <p className="mt-8 text-sm text-muted">Official full-length practice tests are available in College Board’s <Link className="underline" href="https://bluebook.collegeboard.org/" target="_blank" rel="noopener noreferrer">Bluebook app</Link>.</p>
  </div>;
}
