"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TAXONOMY } from "@/lib/types";
import {
  EMPTY_ANSWERS,
  STORAGE_KEY,
  STUDY_OPTIONS,
  buildPlan,
  classOptions,
  daysUntil,
  formatDate,
  ordinal,
  percentile,
  questionsPerDay,
  upcomingDates,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import { Owl, type OwlMood } from "../Owl";
import { Logo } from "../Logo";
import { Button, LinkButton } from "../ui";
import { IArrowL, IArrowR, ICheck, IClock, IExam, IFireSolid, ISparkle, ITarget, IX } from "../icons";
import { ScoreCurve } from "./ScoreCurve";

const STEPS = ["welcome", "current", "goal", "class", "date", "time", "focus", "plan"] as const;
type Step = (typeof STEPS)[number];

const DOMAIN_HINT: Record<string, string> = {
  Algebra: "Linear equations, systems, inequalities",
  "Advanced Math": "Quadratics, exponentials, functions",
  "Problem-Solving and Data Analysis": "Ratios, percents, statistics",
  "Geometry and Trigonometry": "Area, volume, circles, trig",
  "Information and Ideas": "Main ideas, evidence, inferences",
  "Craft and Structure": "Vocabulary in context, purpose",
  "Expression of Ideas": "Transitions, rhetorical synthesis",
  "Standard English Conventions": "Grammar, punctuation, structure",
};

const CHECKLIST = ["Reading your goal", "Matching skills to your weak spots", "Scheduling around your test date", "Setting your daily target"];

type Props = { signedIn: boolean; firstName: string; initial?: Partial<OnboardingAnswers> };

export function Onboarding({ signedIn, firstName, initial }: Props) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState<1 | -1>(1);
  const [a, setA] = useState<OnboardingAnswers>({ ...EMPTY_ANSWERS, name: firstName, ...initial });
  const [cur, setCur] = useState(initial?.currentScore ?? 1000);
  const [untested, setUntested] = useState(false);
  const [goal, setGoal] = useState(initial?.targetScore ?? 1400);
  const [goalTouched, setGoalTouched] = useState(false);
  const [dateUnsure, setDateUnsure] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [notSure, setNotSure] = useState(false);
  const [built, setBuilt] = useState(0); // checklist items done on the plan step
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Set<Step>>(new Set());
  const idx = STEPS.indexOf(step);
  const dates = useMemo(() => upcomingDates(today), [today]);
  const classes = useMemo(() => classOptions(today), [today]);
  const recommended = dates.find((d) => d.days >= 45)?.iso;

  const set = (patch: Partial<OnboardingAnswers>) => setA((p) => ({ ...p, ...patch }));

  const go = (to: Step, d: 1 | -1 = 1) => {
    setDir(d);
    setStep(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Commit the current step's draft values, mark it done, and move on. */
  const next = (skip = false) => {
    if (!skip) {
      if (step === "current") set({ currentScore: untested ? null : cur });
      if (step === "goal") set({ targetScore: goal });
      if (step === "current" && !goalTouched) setGoal(Math.min(1600, Math.max(untested ? 1300 : cur + 200, 600)));
    }
    setDone((s) => new Set(s).add(step));
    go(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  };
  const back = () => go(STEPS[Math.max(idx - 1, 0)], -1);

  // Build the plan with a short, honest "working" moment.
  useEffect(() => {
    if (step !== "plan") return;
    setBuilt(0);
    const timers = CHECKLIST.map((_, i) => setTimeout(() => setBuilt(i + 1), 650 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const plan = useMemo(() => buildPlan(a, today), [a, today]);
  const ready = built >= CHECKLIST.length;

  /* ---------- validity ---------- */
  const valid: Record<Step, boolean> = {
    welcome: true,
    current: true,
    goal: true,
    class: !!a.gradClass,
    date: a.testDate !== null || dateUnsure,
    time: a.studyMinutes !== null,
    focus: a.focus.length > 0 || notSure,
    plan: true,
  };

  // Enter = continue (unless typing in a field that uses Enter itself)
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || step === "plan" || !valid[step]) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "BUTTON" || t.tagName === "A") return;
      nextRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------- saving ---------- */
  const answers = (): OnboardingAnswers => ({ ...a, targetScore: a.targetScore ?? goal });
  const save = async (to: string) => {
    setSaving(true);
    if (signedIn) {
      await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(answers()) });
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers()));
      } catch {}
    }
    router.push(to);
    router.refresh();
  };
  const close = async () => {
    if (signedIn) {
      await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skip: true }) });
      router.push("/dashboard");
      router.refresh();
    } else router.push("/");
  };

  /* ---------- the owl's commentary ---------- */
  const owl = useMemo((): { mood: OwlMood; text: string } => {
    const who = a.name.trim() || firstName;
    switch (step) {
      case "welcome":
        return { mood: "idle", text: who ? `Hi ${who}! Let's build your plan. It takes about a minute.` : "Hi! I'm your study buddy. Let's build your plan. It takes about a minute." };
      case "current":
        return { mood: "idle", text: untested ? "No worries. Everyone starts somewhere, and I'll help you find your baseline." : "A rough guess is totally fine. This just sets your starting line." };
      case "goal": {
        const p = percentile(goal);
        return { mood: "celebrate", text: `${goal} beats about ${p}% of test takers. ${goal >= 1400 ? "Ambitious, and very doable with a plan." : "A strong, realistic target."}` };
      }
      case "class":
        return { mood: "idle", text: "Your year tells me which test dates are realistic for you." };
      case "date": {
        const d = a.testDate ? daysUntil(a.testDate, today) : null;
        return { mood: "idle", text: d === null ? "A deadline makes practice real. Pick the one you're aiming for." : d < 28 ? `${d} days. Tight, but we can make every session count.` : `${d} days is plenty of runway. Nice.` };
      }
      case "time":
        return { mood: "idle", text: "Consistency beats cramming. Pick something you'll actually stick with." };
      case "focus":
        return { mood: "idle", text: "Pick what feels shaky. Not sure? A baseline test will show us." };
      case "plan":
        return ready ? { mood: "celebrate", text: "All set! Here's your plan." } : { mood: "loading", text: "Building your plan…" };
    }
  }, [step, a.name, a.testDate, firstName, goal, untested, ready, today]);

  /* ---------- progress dots ---------- */
  const dots = (
    <ol className="flex items-center justify-center gap-2" aria-label="Progress">
      {STEPS.map((s, i) => {
        const complete = done.has(s) && i < idx;
        const active = i === idx;
        return (
          <li key={s}>
            <button
              type="button"
              disabled={i >= idx}
              onClick={() => go(s, -1)}
              aria-label={`Step ${i + 1}${active ? " (current)" : complete ? " (done)" : ""}`}
              aria-current={active ? "step" : undefined}
              className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-medium transition-all duration-300 ${
                complete ? "bg-ok-500 text-white hover:scale-110" : active ? "scale-110 bg-red text-white shadow-[0_0_0_4px_rgb(165_12_38/0.15)]" : "bg-surface-2 text-faint"
              }`}
            >
              {complete ? <ICheck className="h-4 w-4" /> : i + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );

  /* ---------- summary chips (grows as you answer) ---------- */
  const chips: { k: string; v: string }[] = [];
  if (a.currentScore !== null && idx > 1) chips.push({ k: "Now", v: String(a.currentScore) });
  else if (untested && idx > 1) chips.push({ k: "Now", v: "New to the SAT" });
  if (a.targetScore !== null && idx > 2) chips.push({ k: "Goal", v: String(a.targetScore) });
  if (a.gradClass && idx > 3) chips.push({ k: "Class", v: a.gradClass === "other" ? "Other" : `of ${a.gradClass}` });
  if (a.testDate && idx > 4) chips.push({ k: "Test", v: formatDate(a.testDate, { month: "short", day: "numeric" }) });
  if (a.studyMinutes && idx > 5) chips.push({ k: "Daily", v: `${a.studyMinutes} min` });

  const stage = (
    <aside className="relative h-full overflow-hidden rounded-3xl bg-red p-6 text-white lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-10">
      <div className="pattern-grid pointer-events-none absolute inset-0 text-white opacity-[0.05]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-red-600/60" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-gold/25" aria-hidden="true" />
      <div className="relative flex items-center gap-4 lg:flex-col lg:gap-6">
        <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)] lg:h-[210px] lg:w-[210px]">
          <Owl key={step + owl.mood} mood={owl.mood} size={72} className="lg:hidden" />
          <Owl key={"d" + step + owl.mood} mood={owl.mood} size={160} className="hidden lg:block" />
        </div>
        <div key={step + owl.text} className="relative max-w-sm animate-[bubble-in_380ms_var(--ease-out)_both] rounded-2xl rounded-bl-md bg-white px-5 py-3.5 text-[15px] leading-snug text-ink shadow-pop lg:rounded-bl-2xl lg:rounded-t-2xl" role="status">
          {owl.text}
          <span className="absolute -top-2 left-8 hidden h-4 w-4 rotate-45 rounded-sm bg-white lg:block" aria-hidden="true" />
        </div>
      </div>
      {chips.length > 0 && (
        <ul className="relative mt-6 flex flex-wrap justify-center gap-2 lg:mt-8">
          {chips.map((c) => (
            <li key={c.k} className="animate-[pop-in_300ms_var(--ease-out)_both] rounded-full bg-white/15 px-3 py-1.5 text-[13px] backdrop-blur-sm">
              <span className="text-white/70">{c.k}</span> <span className="font-medium tabular-nums">{c.v}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  /* ---------- step bodies ---------- */
  const radioRow = (on: boolean) =>
    `flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${on ? "border-red bg-red-50" : "border-line-strong bg-white hover:border-ink/30"}`;
  const dot = (on: boolean) => (
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-red bg-red text-white" : "border-line-strong"}`}>{on && <ICheck className="h-3 w-3" />}</span>
  );

  const content: Record<Exclude<Step, "plan">, { title: string; sub: string; body: ReactNode }> = {
    welcome: {
      title: signedIn || firstName ? `Welcome, ${firstName}.` : "Welcome to ScholarSAT.",
      sub: "A few quick questions, then a study plan built around you.",
      body: (
        <div className="grid gap-5">
          {!signedIn && (
            <label className="grid gap-2 text-sm font-medium">
              What should we call you?
              <input value={a.name} onChange={(e) => set({ name: e.target.value.slice(0, 40) })} placeholder="First name" autoComplete="given-name" autoFocus className="w-full rounded-xl border border-line-strong px-4 py-3 text-[15px] font-normal outline-none transition-shadow placeholder:text-faint focus:border-red focus:ring-4 focus:ring-red/10" />
            </label>
          )}
          <ul className="grid gap-3">
            {[
              [ITarget, "Set your target score", "See what it means compared to everyone else."],
              [IClock, "Pick your test date", "We'll work backwards from it."],
              [ISparkle, "Get your daily plan", "Questions, review, and mock tests, scheduled."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof ITarget;
              return (
                <li key={t as string} className="flex items-center gap-3.5 rounded-xl border border-line bg-surface px-4 py-3 animate-[slide-in-r_420ms_var(--ease-out)_both]" style={{ animationDelay: `${120 + i * 110}ms` }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red"><I className="h-5 w-5" /></span>
                  <span><span className="block text-[15px] font-medium">{t as string}</span><span className="text-sm text-muted">{d as string}</span></span>
                </li>
              );
            })}
          </ul>
          <p className="text-center text-xs text-faint">Takes about a minute. You can change everything later.</p>
        </div>
      ),
    },
    current: {
      title: "Where are you right now?",
      sub: "Your latest SAT or practice test score. A rough guess works.",
      body: (
        <div className="grid gap-4">
          <div className={untested ? "pointer-events-none opacity-35 transition-opacity" : "transition-opacity"} aria-hidden={untested}>
            <ScoreCurve value={cur} onChange={setCur} />
          </div>
          <button type="button" onClick={() => setUntested((u) => !u)} aria-pressed={untested} className={radioRow(untested)}>
            {dot(untested)}
            <span className="text-[15px]">I haven&apos;t taken the SAT yet</span>
          </button>
        </div>
      ),
    },
    goal: {
      title: "Imagine your dream score.",
      sub: "When scores come out, what do you want to see?",
      body: <ScoreCurve value={goal} onChange={(v) => { setGoal(v); setGoalTouched(true); }} from={untested ? null : a.currentScore} presets={[1200, 1350, 1450, 1550]} />,
    },
    class: {
      title: "Tell us about yourself.",
      sub: "Your graduating class helps us pick realistic test dates.",
      body: (
        <div className="grid gap-2.5" role="radiogroup" aria-label="Graduating class">
          {classes.map((c) => {
            const on = a.gradClass === c.value;
            return (
              <button key={c.value} type="button" role="radio" aria-checked={on} onClick={() => set({ gradClass: c.value })} className={radioRow(on)}>
                {dot(on)}
                <span className="text-[15px] font-medium">{c.label}</span>
                <span className="ml-auto text-sm text-muted">{c.sub}</span>
              </button>
            );
          })}
        </div>
      ),
    },
    date: {
      title: "When are you taking the SAT?",
      sub: "We'll build your schedule backwards from this day.",
      body: (
        <div className="grid gap-2.5" role="radiogroup" aria-label="Test date">
          {dates.map((d) => {
            const on = a.testDate === d.iso && !customOpen;
            return (
              <button key={d.iso} type="button" role="radio" aria-checked={on} onClick={() => { set({ testDate: d.iso }); setDateUnsure(false); setCustomOpen(false); }} className={radioRow(on)}>
                {dot(on)}
                <span>
                  <span className="text-[15px] font-medium">{formatDate(d.iso, { month: "long", day: "numeric" })}</span>
                  <span className="ml-2 text-sm text-muted">{formatDate(d.iso, { weekday: "long" })}</span>
                </span>
                {d.iso === recommended && <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-600">Recommended</span>}
                <span className="ml-auto text-sm text-muted tabular-nums">in {d.days} days</span>
              </button>
            );
          })}
          <button type="button" role="radio" aria-checked={customOpen} onClick={() => { setCustomOpen(true); setDateUnsure(false); }} className={radioRow(customOpen)}>
            {dot(customOpen)}
            <span className="text-[15px] font-medium">A different date</span>
          </button>
          {customOpen && (
            <input
              type="date"
              aria-label="Custom test date"
              min={new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10)}
              value={a.testDate && !dates.some((d) => d.iso === a.testDate) ? a.testDate : ""}
              onChange={(e) => set({ testDate: e.target.value || null })}
              className="w-full animate-rise rounded-xl border border-line-strong px-4 py-3 text-[15px] outline-none focus:border-red focus:ring-4 focus:ring-red/10"
            />
          )}
          <button type="button" role="radio" aria-checked={dateUnsure} onClick={() => { setDateUnsure(true); setCustomOpen(false); set({ testDate: null }); }} className={radioRow(dateUnsure)}>
            {dot(dateUnsure)}
            <span className="text-[15px] font-medium">Not sure yet</span>
          </button>
          <p className="text-xs text-faint">Typical national dates. Confirm exact dates and registration on collegeboard.org.</p>
        </div>
      ),
    },
    time: {
      title: "How much time can you give?",
      sub: "Be realistic. A habit you keep beats a plan you drop.",
      body: (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Daily study time">
            {STUDY_OPTIONS.map((o) => {
              const on = a.studyMinutes === o.minutes;
              return (
                <button key={o.minutes} type="button" role="radio" aria-checked={on} onClick={() => set({ studyMinutes: o.minutes })} className={`rounded-2xl border-2 p-4 text-left transition-all ${on ? "border-red bg-red-50 shadow-card" : "border-line-strong bg-white hover:border-ink/30"}`}>
                  <p className="eyebrow text-muted">{o.label}</p>
                  <p className="mt-1 text-[22px] leading-tight font-medium tabular-nums">{o.minutes} <span className="text-sm font-normal text-muted">min / day</span></p>
                  <p className="mt-1 text-sm text-muted">≈ {questionsPerDay(o.minutes)} questions</p>
                </button>
              );
            })}
          </div>
          {a.studyMinutes && (
            <p className="animate-rise rounded-xl bg-surface px-4 py-3 text-sm text-ink-2">
              {a.testDate
                ? <>That&apos;s about <span className="font-medium text-red tabular-nums">{buildPlan(a, today).totalQuestions?.toLocaleString()}</span> questions before {formatDate(a.testDate, { month: "long", day: "numeric" })}.</>
                : <>That&apos;s about <span className="font-medium text-red tabular-nums">{(questionsPerDay(a.studyMinutes) * 30).toLocaleString()}</span> questions a month.</>}
            </p>
          )}
        </div>
      ),
    },
    focus: {
      title: "What feels shaky?",
      sub: "Pick any areas you want to focus on first.",
      body: (
        <div className="grid gap-4">
          {(["math", "rw"] as const).map((sec) => (
            <div key={sec}>
              <p className="eyebrow mb-2 text-muted">{sec === "math" ? "Math" : "Reading & Writing"}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {TAXONOMY[sec].map((d) => {
                  const on = a.focus.includes(d.domain);
                  return (
                    <button
                      key={d.domain}
                      type="button"
                      aria-pressed={on}
                      onClick={() => { setNotSure(false); set({ focus: on ? a.focus.filter((x) => x !== d.domain) : [...a.focus, d.domain] }); }}
                      className={`rounded-xl border-2 px-3.5 py-2.5 text-left transition-colors ${on ? "border-red bg-red-50" : "border-line-strong bg-white hover:border-ink/30"}`}
                    >
                      <span className="flex items-center justify-between gap-2 text-[14px] font-medium">{d.domain}{on && <ICheck className="h-4 w-4 shrink-0 text-red" />}</span>
                      <span className="mt-0.5 block text-xs text-muted">{DOMAIN_HINT[d.domain]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" aria-pressed={notSure} onClick={() => { setNotSure((n) => !n); set({ focus: [] }); }} className={radioRow(notSure)}>
            {dot(notSure)}
            <span className="text-[15px]">Not sure. Help me find out with a baseline test.</span>
          </button>
        </div>
      ),
    },
  };

  /* ---------- the plan ---------- */
  const targetPct = a.targetScore ? percentile(a.targetScore) : null;
  const KIND = {
    practice: "bg-red-50 text-red",
    review: "bg-gold-50 text-gold-600",
    test: "bg-ink text-white",
    rest: "bg-surface-2 text-muted",
  } as const;

  const planView = (
    <div className="mx-auto w-full max-w-[920px]">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {stage}
        <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          {!ready ? (
            <div className="grid min-h-[420px] place-content-center px-8 py-10">
              <ul className="grid gap-3.5" aria-live="polite">
                {CHECKLIST.map((c, i) => {
                  const ok = built > i;
                  return (
                    <li key={c} className={`flex items-center gap-3 text-[16px] transition-opacity duration-300 ${built >= i ? "opacity-100" : "opacity-30"}`}>
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${ok ? "animate-[check-pop_320ms_var(--ease-out)] bg-ok-500 text-white" : "border-2 border-line-strong"}`}>{ok && <ICheck className="h-4 w-4" />}</span>
                      {c}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="animate-rise">
              <div className="border-t-4 border-red-700 bg-red px-7 py-5 text-white">
                <p className="eyebrow text-white/75">Your study plan{a.name ? ` · ${a.name}` : ""}</p>
                <h1 className="mt-1 text-[26px] leading-tight font-medium tracking-[-0.01em]">{plan.headline}</h1>
              </div>
              <div className="grid gap-5 p-6 sm:p-7">
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { k: "Target", v: a.targetScore ?? "–", s: targetPct ? `${ordinal(targetPct)} percentile` : "", i: <ITarget className="h-4 w-4" /> },
                    { k: "Days left", v: plan.days ?? "–", s: a.testDate ? formatDate(a.testDate, { month: "short", day: "numeric" }) : "No date yet", i: <IClock className="h-4 w-4" /> },
                    { k: "Daily goal", v: plan.perDay, s: `questions · ${a.studyMinutes ?? 30} min`, i: <IFireSolid className="h-4 w-4" /> },
                    { k: plan.totalQuestions ? "By test day" : "Per month", v: (plan.totalQuestions ?? plan.perDay * 30).toLocaleString(), s: "questions", i: <IExam className="h-4 w-4" /> },
                  ].map((t, i) => (
                    <div key={t.k} className="animate-[pop-in_380ms_var(--ease-out)_both] rounded-2xl border border-line bg-surface p-3.5" style={{ animationDelay: `${i * 80}ms` }}>
                      <dt className="flex items-center gap-1.5 text-xs text-muted">{t.i}{t.k}</dt>
                      <dd className="mt-1 text-[26px] leading-none font-medium tabular-nums">{t.v}</dd>
                      <dd className="mt-1 text-xs text-muted">{t.s}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <p className="eyebrow mb-2 text-muted">Your typical week</p>
                  <ol className="grid grid-cols-7 gap-1.5">
                    {plan.week.map((d, i) => (
                      <li key={d.day} className={`animate-[pop-in_320ms_var(--ease-out)_both] rounded-xl px-1.5 py-2.5 text-center ${KIND[d.kind]}`} style={{ animationDelay: `${300 + i * 60}ms` }}>
                        <p className="text-[11px] font-medium opacity-80">{d.day}</p>
                        <p className="mt-1 line-clamp-3 text-[11px] leading-tight">{d.label}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-red-100" />Practice</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-gold-100" />Review</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-ink" />Timed test</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-surface-2" />Rest</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-red-100 bg-red-50/60 p-4">
                  <div>
                    <p className="eyebrow text-red">Your first step</p>
                    <p className="mt-0.5 text-[17px] font-medium">{plan.start.label}</p>
                    <p className="text-sm text-muted">{plan.focus.length ? "10 questions, about 25 minutes." : "A full-length test shows exactly where to start."}</p>
                  </div>
                  {signedIn ? (
                    <Button size="lg" disabled={saving} onClick={() => save(plan.start.href)}>{saving ? "Saving…" : <>Let&apos;s go <IArrowR className="h-4 w-4" /></>}</Button>
                  ) : (
                    <LinkButton size="lg" href="/signup?next=/onboarding/finish" onClick={() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers())); } catch {} }}>Save my plan <IArrowR className="h-4 w-4" /></LinkButton>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <button type="button" onClick={() => go("welcome", -1)} className="text-muted hover:text-ink">← Start over</button>
                  {signedIn ? (
                    <button type="button" disabled={saving} onClick={() => save("/dashboard")} className="font-medium text-red hover:underline">Go to my dashboard</button>
                  ) : (
                    <button type="button" disabled={saving} onClick={() => save("/practice")} className="text-muted hover:text-ink">Keep practicing as a guest</button>
                  )}
                </div>
                <p className="text-center text-[11px] text-faint">Percentiles and projections are estimates to help you plan, not official College Board data.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  /* ---------- shell ---------- */
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="w-[200px] max-sm:w-auto"><Logo href={signedIn ? "/dashboard" : "/"} size={34} /></div>
        <div className="hidden sm:block">{dots}</div>
        <div className="flex w-[200px] justify-end max-sm:w-auto">
          <button type="button" onClick={close} aria-label="Close onboarding" className="grid h-10 w-10 place-items-center rounded-full bg-white text-muted shadow-card transition-colors hover:text-ink"><IX className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="px-5 pb-1 sm:hidden">{dots}</div>

      <main className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
        {step === "plan" ? (
          planView
        ) : (
          <div className="grid w-full max-w-[1040px] items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-10">
            <div className="order-1 h-full lg:order-none">{stage}</div>
            <section
              key={step}
              className="order-2 overflow-hidden rounded-3xl border border-line bg-white shadow-card lg:order-none"
              style={{ animation: `${dir === 1 ? "slide-in-r" : "slide-in-l"} 380ms var(--ease-out) both` }}
            >
              <div className="border-t-4 border-red-700 bg-red px-7 py-5 text-white">
                <h1 className="text-[24px] leading-tight font-medium tracking-[-0.01em]">{content[step].title}</h1>
                <p className="mt-1 text-[14px] text-white/85">{content[step].sub}</p>
              </div>
              <div className="min-h-[300px] p-6 sm:p-7">{content[step].body}</div>
              <footer className="flex items-center gap-3 border-t border-line px-6 py-4 sm:px-7">
                {idx > 0 ? (
                  <Button variant="ghost" onClick={back}><IArrowL className="h-4 w-4" /> Back</Button>
                ) : (
                  <Link href={signedIn ? "/dashboard" : "/"} onClick={(e) => { if (signedIn) { e.preventDefault(); close(); } }} className="px-3 text-sm text-muted hover:text-ink">Not now</Link>
                )}
                {idx > 0 && <button type="button" onClick={() => next(true)} className="px-2 text-sm text-muted hover:text-ink">Skip for now</button>}
                <Button className="ml-auto" size="lg" disabled={!valid[step]} onClick={() => next()}>
                  {step === "welcome" ? "Let's go" : step === "focus" ? "Build my plan" : "Continue"} <IArrowR className="h-4 w-4" />
                </Button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
