import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { userStats } from "@/lib/stats";
import { counts, QUESTIONS, utcDay } from "@/lib/bank";
import { getDailyPoll } from "@/lib/daily";
import { DailyPoll } from "@/components/DailyPoll";
import { ProgressBody } from "@/components/ProgressCard";
import { db } from "@/lib/db";
import { TAXONOMY, SECTION_LABEL, type Section } from "@/lib/types";
import { Badge, Card, HeaderCard, LinkButton, Progress } from "@/components/ui";
import { IArrowR, IChevR, IFireSolid, ITarget } from "@/components/icons";
import { questionsPerDay } from "@/lib/onboarding";

export const metadata: Metadata = { title: "Home" };

const DEFAULT_DAILY_GOAL = 20;

export default async function Dashboard() {
  const user = await requireUser();
  if (!user.onboarded_at) redirect("/onboarding");
  const DAILY_GOAL = user.study_minutes ? questionsPerDay(user.study_minutes) : DEFAULT_DAILY_GOAL;
  const s = userStats(user.id);
  const c = counts();
  const polls = { math: getDailyPoll("math", user.id), rw: getDailyPoll("rw", user.id) };
  const dayNo = utcDay() - 20400; // stable, human-sized daily number
  const tests = db.prepare("SELECT id, finished_at, score_rw, score_math FROM tests WHERE user_id = ? ORDER BY id DESC LIMIT 3").all(user.id) as { id: number; finished_at: number | null; score_rw: number | null; score_math: number | null }[];
  const openTest = tests.find((t) => !t.finished_at);
  const daysLeft = user.test_date ? Math.ceil((new Date(user.test_date + "T00:00:00").getTime() - Date.now()) / 86400000) : null;
  const today = s.activity[s.activity.length - 1]?.count ?? 0;
  const maxAct = Math.max(1, ...s.activity.map((a) => a.count));
  const first = user.name.split(" ")[0];
  const lastQ = db.prepare("SELECT question_id FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(user.id) as { question_id: string } | undefined;
  const lastSkill = lastQ ? QUESTIONS.find((q) => q.id === lastQ.question_id) : undefined;

  const weak = Object.entries(s.bySkill)
    .filter(([, v]) => v.seen >= 3)
    .map(([k, v]) => ({ skill: k, ...v, acc: v.correct / v.seen }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="animate-rise">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-tight font-medium tracking-[-0.01em]">Welcome back, {first}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} until your SAT. Let's make them count.` : "Every question you practice moves you forward."}
          </p>
        </div>
        <LinkButton href="/practice">Start practicing <IArrowR className="h-4 w-4" /></LinkButton>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <HeaderCard
            title={<span className="flex items-center gap-2.5">Daily Questions <span className="rounded-md bg-white/20 px-2 py-0.5 text-[13px]">#{dayNo}</span></span>}
            right={<span>{dateLabel}</span>}
            bodyClassName=""
          >
            <DailyPoll polls={polls} />
          </HeaderCard>

          <HeaderCard title="Pick up where you left off" tone="ok" bodyClassName="p-5">
            {openTest ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Practice test #{openTest.id} is in progress</p>
                  <p className="text-sm text-muted">Your answers and timer are saved.</p>
                </div>
                <LinkButton href={`/tests/${openTest.id}`} variant="success">Resume test</LinkButton>
              </div>
            ) : lastSkill ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-muted">Last practiced</p>
                  <p className="truncate font-medium">{lastSkill.skill}</p>
                </div>
                <LinkButton href={`/practice/play?section=${lastSkill.section}&skill=${encodeURIComponent(lastSkill.skill)}&status=unanswered`} variant="success">Continue</LinkButton>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-sm text-sm text-muted">Your most recent practice shows up here so you can jump straight back in.</p>
                <LinkButton href="/practice" variant="success">Begin</LinkButton>
              </div>
            )}
          </HeaderCard>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-medium">Focus next</h2>
              <span className="text-xs text-muted">Your weakest skills</span>
            </div>
            {weak.length ? (
              <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
                {weak.map((w) => (
                  <li key={w.skill} className="min-w-0">
                    <Link href={`/practice/play?section=${w.section}&skill=${encodeURIComponent(w.skill)}`} className="group flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm transition-colors hover:border-red-200 hover:bg-red-50/50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{w.skill}</span>
                        <span className="text-xs text-muted">{w.domain}</span>
                      </span>
                      <Badge tone={w.acc < 0.5 ? "bad" : "warn"}>{Math.round(w.acc * 100)}%</Badge>
                      <IChevR className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Answer a few questions in a skill and the ones that need the most work show up here.</p>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="flex flex-col items-center justify-center py-6 text-center">
              <span className="flex items-center gap-1.5">
                <IFireSolid className={`h-8 w-8 ${s.streak ? "flame" : "opacity-40 grayscale"}`} />
                <span className={`text-[32px] leading-none font-medium tabular-nums ${s.streak ? "text-ink" : "text-faint"}`}>{s.streak}</span>
              </span>
              <span className="mt-2 text-sm text-muted">day streak</span>
            </Card>
            <Card className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm font-medium">Next SAT</p>
              {daysLeft !== null && daysLeft >= 0 ? (
                <>
                  <p className="mt-1 text-[28px] leading-none font-medium text-red tabular-nums">{daysLeft}</p>
                  <p className="mt-1 text-xs text-muted">days to go</p>
                </>
              ) : (
                <Link href="/settings" className="mt-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">Set test date</Link>
              )}
            </Card>
            <Card className="flex flex-col items-center justify-center py-6 text-center">
              <p className="flex items-center gap-1 text-sm font-medium"><ITarget className="h-4 w-4 text-red" /> Goal</p>
              {user.target_score ? (
                <p className="mt-1 text-[28px] leading-none font-medium tabular-nums">{user.target_score}</p>
              ) : (
                <Link href="/settings" className="mt-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">Set a goal</Link>
              )}
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-medium">Daily goal</h2>
              {today >= DAILY_GOAL && <Badge tone="ok">Done for today</Badge>}
            </div>
            <div className="mt-4"><Progress value={today / DAILY_GOAL} tone={today >= DAILY_GOAL ? "ok" : "gold"} className="h-9 rounded-xl" /></div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-sm text-muted"><span className="font-medium text-ink tabular-nums">{Math.min(today, DAILY_GOAL)}</span> / {DAILY_GOAL} questions today</p>
              <div className="flex h-8 w-40 items-end gap-[3px]" aria-label="Questions answered over the last 14 days">
                {s.activity.map((a) => (
                  <div key={a.day} className={`flex-1 rounded-[3px] ${a.count ? "bg-gold" : "bg-surface-2"}`} style={{ height: `${a.count ? 25 + (a.count / maxAct) * 75 : 18}%` }} title={`${a.count} answered`} />
                ))}
              </div>
            </div>
          </Card>

          <HeaderCard title="Your Progress" right={<Link href="/tests" className="hover:underline">Practice tests →</Link>} bodyClassName="p-5">
            <ProgressBody
              predicted={s.predicted}
              unique={s.unique}
              correct={s.correct}
              bankTotal={c.total}
              sections={(["math", "rw"] as Section[]).map((sec) => ({
                key: sec,
                label: SECTION_LABEL[sec],
                seen: s.bySection[sec].seen,
                domains: TAXONOMY[sec].map((d) => {
                  const skills = d.skills.map((k) => s.bySkill[k]).filter(Boolean);
                  const seen = skills.reduce((a, b) => a + b.seen, 0);
                  const corr = skills.reduce((a, b) => a + b.correct, 0);
                  return { name: d.domain, href: `/practice/play?section=${sec}&domain=${encodeURIComponent(d.domain)}`, seen, acc: seen ? corr / seen : 0 };
                }),
              }))}
            />
          </HeaderCard>
        </div>
      </div>
    </div>
  );
}
