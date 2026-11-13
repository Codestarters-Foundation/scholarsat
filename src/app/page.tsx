import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { counts, QUESTIONS } from "@/lib/bank";
import { TAXONOMY } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Rich } from "@/components/Rich";
import { ICheck, IGithub, IArrowR, IClock, IBook, IRefresh, ICards, ITarget, IFire } from "@/components/icons";

export const dynamic = "force-dynamic";
const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/smaranz/scholarsat";

const FAQ = [
  ["Is ScholarSAT really free?", "Yes. Every question, every practice test, and every feature is free, with no trial and no premium tier. The project is open source, so anyone can read the code and run their own copy."],
  ["Are these official College Board questions?", "No. ScholarSAT's questions are written and generated for this project, following the published structure of the digital SAT: the same domains, skills, and question formats. For official material, we link straight to College Board's free Bluebook tests and question bank."],
  ["How are the math answers checked?", "Every math question is built from parameters, and its answer is computed by the program rather than typed by hand. Type-in answers accept any equivalent form, so 0.5, .5, and 1/2 are all marked correct."],
  ["How accurate is the predicted score?", "It's an estimate based on your accuracy across ScholarSAT questions and mock tests, weighted by difficulty. Use it to track direction and progress, and use official Bluebook tests for the most realistic benchmark."],
  ["Do I need an account?", "No. You can practice from the question bank right away. A free account adds progress tracking, saved questions, mistake review, and full-length practice tests."],
  ["Who runs ScholarSAT?", "ScholarSAT is an independent open-source project built on the belief that high-quality test prep shouldn't cost hundreds of dollars. Contributions are welcome on GitHub."],
];

export default async function Landing() {
  const user = await getUser();
  const c = counts();
  const sample = QUESTIONS.find((q) => q.section === "math" && q.type === "mcq" && q.difficulty === "M" && q.skill === "Systems of two linear equations in two variables")!;
  const skillCount = TAXONOMY.math.flatMap((d) => d.skills).length + TAXONOMY.rw.flatMap((d) => d.skills).length;

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo size={34} />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Site">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink"><IGithub className="h-4 w-4" /> GitHub</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="rounded-xl bg-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Go to dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-ink sm:inline-block">Log in</Link>
                <Link href="/signup" className="rounded-xl bg-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Start free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-gold-50" />
        <div className="pointer-events-none absolute -left-32 top-64 h-72 w-72 rounded-full bg-red-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-100 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> 100% free · open source · no paywalls
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Serious SAT prep.<br />
              <span className="text-red">Zero cost.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              {c.total.toLocaleString()} practice questions with step-by-step explanations, adaptive full-length mock tests, and a dashboard that shows exactly what to study next. Everything is free, for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 rounded-xl bg-red px-6 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(165,12,38,0.6)] hover:bg-red-600">
                {user ? "Open dashboard" : "Create free account"} <IArrowR className="h-4 w-4" />
              </Link>
              <Link href="/practice" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-base font-semibold text-ink hover:border-red/40">
                Try questions, no signup
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["No credit card", "No trial that expires", "Works on any device"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><ICheck className="h-4 w-4 text-ok" /> {t}</li>
              ))}
            </ul>
          </div>

          {/* Product preview built from real UI pieces */}
          <div className="relative">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-[0_30px_80px_-30px_rgba(27,20,22,0.35)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">Math · Algebra</p>
                <span className="rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-gold-600">Medium</span>
              </div>
              <Rich text={sample.stem} className="mt-3 text-[0.95rem] font-medium" />
              <div className="mt-4 grid gap-2">
                {sample.choices!.map((ch, i) => {
                  const L = "ABCD"[i];
                  const right = L === sample.answer;
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${right ? "border-ok bg-ok-50" : "border-line"}`}>
                      <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-semibold ${right ? "border-ok bg-ok text-white" : "border-line"}`}>{L}</span>
                      <Rich text={ch} as="span" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-xl bg-ok-50 p-3 text-sm">
                <p className="font-semibold text-ok">Correct!</p>
                <Rich text={sample.explanation} className="mt-1 text-ink" />
              </div>
            </div>
            <div className="absolute -bottom-20 -left-8 hidden w-52 rounded-2xl border border-line bg-white p-4 shadow-xl sm:block">
              <p className="text-xs text-muted">Predicted score</p>
              <p className="font-display text-4xl font-semibold text-red">1380</p>
              <div className="mt-2 flex h-8 items-end gap-1">
                {[30, 45, 40, 60, 55, 70, 85].map((h, i) => <div key={i} className="flex-1 rounded-sm bg-gold" style={{ height: `${h}%` }} />)}
              </div>
              <p className="mt-1 text-[11px] text-muted">Illustrative example</p>
            </div>
            <div className="absolute -right-4 -top-6 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-lg sm:block">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><IFire className="h-4 w-4 text-gold" /> 12-day streak</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center sm:px-6 md:grid-cols-4">
          {[
            [c.total.toLocaleString(), "practice questions"],
            [String(skillCount), "official test skills covered"],
            ["98", "questions per mock test"],
            ["$0", "forever"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-4xl font-semibold text-red">{n}</p>
              <p className="mt-1 text-sm text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">Everything you need</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">The features other sites charge for, built in and unlocked.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: IBook, t: "A deep question bank", d: `${c.bySection.math.toLocaleString()} math and ${c.bySection.rw.toLocaleString()} reading & writing questions. Filter by domain, skill, and difficulty.` },
            { Icon: IClock, t: "Adaptive mock tests", d: "Full-length, timed tests with two modules per section. Module 2 adapts to how you did on module 1, just like test day." },
            { Icon: ITarget, t: "Predicted score", d: "See an estimated score that updates as you practice, with a breakdown by section and domain." },
            { Icon: IRefresh, t: "Mistake review", d: "Every question you miss is saved automatically. Retry them until they stick." },
            { Icon: ICards, t: "Vocabulary flashcards", d: "High-value words with clear definitions and example sentences. Track what you've mastered." },
            { Icon: IFire, t: "Daily questions & streaks", d: "Two fresh questions every day keep your skills sharp and your streak alive." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-line bg-white p-6 transition-colors hover:border-red/30">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red"><Icon /></div>
              <h3 className="mt-4 font-display text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">How it works</p>
          <h2 className="mt-2 max-w-2xl font-display text-4xl font-semibold tracking-tight">Three steps from wherever you are to your target score.</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Take a baseline test", "Start with a full-length adaptive mock test to see where you stand in every domain."],
              ["Practice your weak spots", "Your dashboard points you to the skills that will raise your score fastest. Drill them in focused sets."],
              ["Review and repeat", "Revisit every mistake with a full explanation, then retest to see your score climb."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="font-display text-5xl font-semibold text-gold">{i + 1}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Open source */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-10 rounded-3xl border border-gold-100 bg-gradient-to-br from-gold-50 to-white p-8 sm:p-12 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">Open source</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Free because it should be.</h2>
            <p className="mt-4 max-w-2xl text-muted">
              Test prep shouldn&apos;t depend on what your family can afford. ScholarSAT&apos;s code and question generators are public under the MIT license. Read them, improve them, or run your own copy for your school.
            </p>
          </div>
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-semibold text-white hover:bg-black">
            <IGithub /> View on GitHub
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-24 sm:px-6">
        <h2 className="text-center font-display text-4xl font-semibold tracking-tight">Questions, answered</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <Image src="/logo.png" alt="" width={88} height={88} loading="eager" className="rounded-full bg-white p-2" />
          <h2 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-white">Your next point starts with one question.</h2>
          <Link href={user ? "/dashboard" : "/signup"} className="rounded-xl bg-white px-7 py-3.5 font-semibold text-red hover:bg-gold-50">
            {user ? "Back to practice" : "Create your free account"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo size={28} />
            <p className="mt-3 max-w-md text-xs">SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, ScholarSAT. All ScholarSAT questions are original.</p>
          </div>
          <nav className="flex flex-wrap gap-5" aria-label="Footer">
            <Link href="/practice" className="hover:text-ink">Question Bank</Link>
            <Link href="/tests" className="hover:text-ink">Practice Tests</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <a href={REPO} className="hover:text-ink" target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
