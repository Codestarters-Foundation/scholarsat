import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { userStats } from "@/lib/stats";
import { counts, dailyQuestion } from "@/lib/bank";
import { db } from "@/lib/db";
import { TAXONOMY, SECTION_LABEL, type Section } from "@/lib/types";
import { Badge, Card, LinkButton, PageTitle, Progress } from "@/components/ui";
import { IArrowR, IFire, ITarget } from "@/components/icons";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser();
  const s = userStats(user.id);
  const c = counts();
  const dq = { rw: dailyQuestion("rw"), math: dailyQuestion("math") };
  const tests = db.prepare("SELECT id, finished_at, score_rw, score_math FROM tests WHERE user_id = ? ORDER BY id DESC LIMIT 3").all(user.id) as { id: number; finished_at: number | null; score_rw: number | null; score_math: number | null }[];
  const lastTest = tests.find((t) => t.finished_at);
  const daysLeft = user.test_date ? Math.ceil((new Date(user.test_date + "T00:00:00").getTime() - Date.now()) / 86400000) : null;
  const maxAct = Math.max(1, ...s.activity.map((a) => a.count));
  const first = user.name.split(" ")[0];

  // weakest skills (need at least 3 answered)
  const weak = Object.entries(s.bySkill)
    .filter(([, v]) => v.seen >= 3)
    .map(([k, v]) => ({ skill: k, ...v, acc: v.correct / v.seen }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);

  return (
    <>
      <PageTitle title={`Welcome back, ${first}`} sub={daysLeft !== null && daysLeft >= 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} until your SAT.` : "Every question you practice moves you forward."} action={<LinkButton href="/practice">Start practicing <IArrowR className="h-4 w-4" /></LinkButton>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Predicted score</p>
          {s.predicted ? (
            <>
              <p className="mt-1 font-display text-4xl font-semibold text-red">{s.predicted.total}</p>
              <p className="mt-1 text-xs text-muted">R&amp;W {s.predicted.rw} · Math {s.predicted.math}</p>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-4xl font-semibold text-line">—</p>
              <p className="mt-1 text-xs text-muted">Answer 10+ questions in each section to unlock.</p>
            </>
          )}
        </Card>
        <Card>
          <p className="text-sm text-muted">Questions answered</p>
          <p className="mt-1 font-display text-4xl font-semibold">{s.unique.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted">{s.unique ? `${Math.round((s.correct / s.unique) * 100)}% correct` : `of ${c.total.toLocaleString()} in the bank`}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-sm text-muted"><IFire className="h-4 w-4 text-gold" /> Daily streak</p>
          <p className="mt-1 font-display text-4xl font-semibold">{s.streak}<span className="ml-1 text-base font-normal text-muted">day{s.streak === 1 ? "" : "s"}</span></p>
          <div className="mt-2 flex h-8 items-end gap-1" aria-label="Activity over the last 14 days">
            {s.activity.map((a) => (
              <div key={a.day} className={`flex-1 rounded-sm ${a.count ? "bg-gold" : "bg-surface"}`} style={{ height: `${a.count ? 20 + (a.count / maxAct) * 80 : 15}%` }} title={`${a.count} answered`} />
            ))}
          </div>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-sm text-muted"><ITarget className="h-4 w-4 text-red" /> Target score</p>
          <p className="mt-1 font-display text-4xl font-semibold">{user.target_score ?? "—"}</p>
          <Link href="/settings" className="mt-1 inline-block text-xs font-semibold text-red hover:underline">{user.target_score ? "Change goal" : "Set a goal"}</Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">Skill breakdown</h2>
          <p className="text-sm text-muted">Accuracy on each domain, based on your latest answer to each question.</p>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {(["rw", "math"] as Section[]).map((sec) => (
              <div key={sec}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-600">{SECTION_LABEL[sec]}</h3>
                <ul className="grid gap-3">
                  {TAXONOMY[sec].map((d) => {
                    const skills = d.skills.map((k) => s.bySkill[k]).filter(Boolean);
                    const seen = skills.reduce((a, b) => a + b.seen, 0);
                    const corr = skills.reduce((a, b) => a + b.correct, 0);
                    return (
                      <li key={d.domain}>
                        <div className="mb-1 flex justify-between text-sm">
                          <Link href={`/practice/play?section=${sec}&domain=${encodeURIComponent(d.domain)}`} className="font-medium hover:text-red">{d.domain}</Link>
                          <span className="tabular-nums text-muted">{seen ? `${Math.round((corr / seen) * 100)}%` : "—"}</span>
                        </div>
                        <Progress value={seen ? corr / seen : 0} tone={seen && corr / seen >= 0.7 ? "ok" : seen && corr / seen < 0.5 ? "red" : "gold"} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="border-gold-100 bg-gradient-to-br from-white to-gold-50">
            <h2 className="font-display text-xl font-semibold">Questions of the day</h2>
            <p className="text-sm text-muted">Same two questions for everyone, every day.</p>
            <div className="mt-4 grid gap-2">
              {(["rw", "math"] as Section[]).map((sec) => (
                <Link key={sec} href={`/practice/play?ids=${dq[sec].id}&title=${encodeURIComponent("Question of the day")}`} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold hover:border-red/40">
                  <span>{SECTION_LABEL[sec]}</span>
                  <span className="flex items-center gap-2 text-xs font-medium text-muted">{dq[sec].skill.split(":")[0]} <IArrowR className="h-4 w-4" /></span>
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">Focus next</h2>
            {weak.length ? (
              <ul className="mt-3 grid gap-2">
                {weak.map((w) => (
                  <li key={w.skill}>
                    <Link href={`/practice/play?section=${w.section}&skill=${encodeURIComponent(w.skill)}`} className="flex items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-sm hover:text-red">
                      <span className="min-w-0 truncate">{w.skill}</span>
                      <Badge tone={w.acc < 0.5 ? "red" : "gold"}>{Math.round(w.acc * 100)}%</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Answer a few questions and we&apos;ll point out the skills that need the most work.</p>
            )}
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">Practice tests</h2>
            {lastTest ? (
              <p className="mt-2 text-sm">Last score: <span className="font-semibold text-red">{(lastTest.score_rw ?? 0) + (lastTest.score_math ?? 0)}</span></p>
            ) : (
              <p className="mt-2 text-sm text-muted">Take a full-length, adaptive mock test to get a baseline.</p>
            )}
            <LinkButton href="/tests" variant="secondary" className="mt-3 w-full">Go to practice tests</LinkButton>
          </Card>
        </div>
      </div>
    </>
  );
}
