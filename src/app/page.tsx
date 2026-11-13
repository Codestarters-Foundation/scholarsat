import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { getUser } from "@/lib/auth";
import { counts, dailyQuestion, QUESTIONS } from "@/lib/bank";
import { rich } from "@/lib/render";
import { MODULES } from "@/lib/tests";
import { DIFFICULTY_LABEL, SECTION_LABEL, TAXONOMY, type Difficulty, type Section } from "@/lib/types";
import { VOCAB } from "@/data/vocab";
import "@/components/landing.css";
import { Logo } from "@/components/Logo";
import { Owl } from "@/components/Owl";
import { LandingQuestion, type LandingItem } from "@/components/LandingQuestion";
import { LandingNav } from "@/components/LandingNav";
import { LandingShowcase } from "@/components/LandingShowcase";
import { CountUp, Reveal } from "@/components/Reveal";
import { btn, LinkButton, Ring } from "@/components/ui";
import { IArrowR, ICheckCircle, IFireSolid, IXCircle } from "@/components/icons";

export const dynamic = "force-dynamic";
const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/smaranz/scholarsat";
const CODESTARTERS = "https://codestarters.org";

/** CSS custom properties read by landing.css: entrance delay and stagger index. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const idx = (i: number) => ({ "--i": i }) as CSSProperties;

const FAQ = [
  ["Is ScholarSAT really free?", "Yes. Every question, every practice test, and every feature is free, with no trial and no premium tier. The project is open source, so anyone can read the code and run their own copy."],
  ["Are these official College Board questions?", "No. ScholarSAT's questions are written and generated for this project, following the published structure of the digital SAT: the same domains, skills, and question formats. For official material, we link straight to College Board's free Bluebook tests and question bank."],
  ["How are the math answers checked?", "Every math question is built from parameters, and its answer is computed by the program rather than typed by hand. Type-in answers accept any equivalent form, so 0.5, .5, and 1/2 are all marked correct."],
  ["How accurate is the predicted score?", "It's an estimate based on your accuracy across ScholarSAT questions and mock tests, weighted by difficulty. Use it to track direction and progress, and use official Bluebook tests for the most realistic benchmark."],
  ["Do I need an account?", "No. You can practice from the question bank right away. A free account adds progress tracking, saved questions, mistake review, and full-length practice tests."],
  ["Who runs ScholarSAT?", "ScholarSAT is a CodeStarters tool, made by CodeStarters (codestarters.org), a student-led nonprofit that makes computer science and AI accessible to every young student. It is open source, built on the belief that high-quality test prep shouldn't cost hundreds of dollars, and contributions are welcome on GitHub."],
];

/** Real questions from the bank, shown in the "try one" section. Short enough to answer in a few seconds. */
const SAMPLE_IDS = ["m30ee0293", "r9980c71a", "m7cf3173b"];

const STEPS = [
  ["Take a baseline test", "Start with a full-length adaptive mock test to see where you stand in every domain."],
  ["Practice your weak spots", "Your dashboard points you to the skills that will raise your score fastest. Drill them in focused sets."],
  ["Review and repeat", "Revisit every mistake with a full explanation, then retest to see your score climb."],
];

function sampleItems(): LandingItem[] {
  const picked = SAMPLE_IDS.map((id) => QUESTIONS.find((q) => q.id === id)).filter((q) => q !== undefined);
  const pool = picked.length ? picked : QUESTIONS.filter((q) => q.type === "mcq" && !q.table && !q.passage2 && q.difficulty === "M").slice(0, 3);
  return pool
    .filter((q) => q.type === "mcq" && q.choices)
    .map((q) => ({
      id: q.id,
      topic: `${q.section === "math" ? "Math" : "Reading and Writing"}, ${q.domain}`,
      difficulty: DIFFICULTY_LABEL[q.difficulty],
      passageHtml: q.passage ? rich(q.passage) : undefined,
      stemHtml: rich(q.stem),
      choicesHtml: q.choices!.map((c) => rich(c)),
      answer: q.answer,
      explanationHtml: rich(q.explanation),
    }));
}

const WRAP = "mx-auto max-w-[1200px] px-5 sm:px-10";
const H2 = "text-[34px] leading-[1.08] font-medium tracking-[-0.03em] text-ink sm:text-[46px]";

/** Accent-coloured words inside a headline. */
function Hl({ children }: { children: ReactNode }) {
  return <span className="text-red">{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <p className="mb-5 inline-block rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[12px] text-muted">{children}</p>;
}

/** Section header: tag, headline and intro on the left, actions on the right. */
function SectionHead({ tag, title, children, actions }: { tag: string; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Tag>{tag}</Tag>
        <h2 className={`${H2} max-w-[20ch]`}>{title}</h2>
        {children && <p className="mt-5 max-w-[56ch] text-[17px] leading-[1.55] text-muted">{children}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </Reveal>
  );
}

/** Bento tile: a product visual on a tinted stage, with a title and one line under it. */
function Tile({ title, children, visual, className = "", i = 0 }: { title: string; children: ReactNode; visual: ReactNode; className?: string; i?: number }) {
  return (
    <div style={idx(i)} className={`lp-stagger lp-lift flex flex-col overflow-hidden rounded-2xl border border-line bg-surface ${className}`}>
      <div className="flex min-h-[240px] flex-1 items-center justify-center p-6 sm:p-8">{visual}</div>
      <div className="border-t border-line bg-white p-6">
        <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{children}</p>
      </div>
    </div>
  );
}

export default async function Landing() {
  const user = await getUser();
  const c = counts();
  const items = sampleItems();
  const skillCount = TAXONOMY.math.flatMap((d) => d.skills).length + TAXONOMY.rw.flatMap((d) => d.skills).length;
  const testQuestions = MODULES.reduce((n, m) => n + m.n, 0);
  const testMinutes = MODULES.reduce((n, m) => n + m.minutes, 0);
  const testLength = `${Math.floor(testMinutes / 60)} h ${testMinutes % 60} min`;
  const byDiff = { E: 0, M: 0, H: 0 } as Record<Difficulty, number>;
  for (const q of QUESTIONS) byDiff[q.difficulty]++;
  const daily = { math: dailyQuestion("math"), rw: dailyQuestion("rw") };
  const word = VOCAB[1] ?? VOCAB[0];
  const missed = ["Systems of two linear equations in two variables", "Percentages", "Transitions"].filter((s) => c.bySkill[s]);
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Create free account";

  return (
    <div className="bg-white text-[15px]">
      <LandingNav signedIn={Boolean(user)} repo={REPO} />
      <div aria-hidden="true" className="h-[60px]" />

      <main>
        {/* Hero */}
        <section className={`${WRAP} pt-8 sm:pt-10`}>
          <div className="grid items-end gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <h1 className="lp-in text-[44px] leading-[1.02] font-medium tracking-[-0.04em] text-ink sm:text-[64px] lg:text-[68px]">
              <span className="lp-line text-red">Free</span> SAT prep.
            </h1>
            <div className="lp-in lg:pb-3" style={delay(150)}>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <LinkButton href={primaryHref} size="lg">{primaryLabel} <IArrowR className="h-4 w-4" /></LinkButton>
                <LinkButton href="/practice" variant="secondary" size="lg">Practice without an account</LinkButton>
              </div>
            </div>
          </div>
          <div className="lp-pop mt-12 sm:mt-16" style={delay(300)}>
            <LandingShowcase />
          </div>
        </section>

        {/* Numbers, counted from the bank */}
        <section className={`${WRAP} py-16 sm:py-20`}>
          <Reveal stagger>
          <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
            {[
              [c.total, "practice questions, each with a worked explanation"],
              [skillCount, "skills covered, the same ones the digital SAT tests"],
              [testQuestions, `questions in every mock test, timed at ${testLength}`],
              ["$0", "for all of it, with no trial and no paid plan"],
            ].map(([n, l], i) => (
              <div key={l} style={idx(i)} className={`lp-stagger flex flex-col-reverse gap-3 px-5 sm:px-8 ${i % 2 ? "border-l border-line" : ""} ${i === 2 ? "lg:border-l lg:border-line" : ""} ${i === 0 ? "pl-0 sm:pl-0" : ""} ${i === 2 ? "pl-0 sm:pl-0 lg:pl-8" : ""}`}>
                <dt className="max-w-[24ch] text-[14px] leading-snug text-muted">{l}</dt>
                <dd className={`text-[52px] leading-none font-medium tracking-[-0.04em] tabular-nums sm:text-[72px] ${i === 3 ? "text-red" : "text-ink"}`}>{typeof n === "number" ? <CountUp to={n} /> : n}</dd>
              </div>
            ))}
          </dl>
          </Reveal>
        </section>

        {/* Question bank */}
        <section id="bank" className="scroll-mt-20 border-t border-line">
          <div className={`${WRAP} py-20 sm:py-28`}>
            <SectionHead
              tag="Question bank"
              title={<>One bank for <Hl>every skill</Hl> on the test</>}
              actions={<LinkButton href="/practice" variant="secondary">Open the question bank <IArrowR className="h-4 w-4" /></LinkButton>}
            >
              Sorted the way the digital SAT is sorted: two sections, eight domains, {skillCount} skills. Pick one skill and drill it, or mix a whole domain.
            </SectionHead>

            <Reveal stagger className="mt-12 grid gap-4 lg:grid-cols-3">
              {(["math", "rw"] as Section[]).map((sec, si) => {
                const max = Math.max(...TAXONOMY[sec].map((d) => c.byDomain[d.domain] ?? 0), 1);
                return (
                  <div key={sec} style={idx(si)} className="lp-stagger lp-lift rounded-2xl border border-line bg-surface p-6 sm:p-7">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{SECTION_LABEL[sec]}</h3>
                      <p className="shrink-0 whitespace-nowrap text-[14px] text-muted tabular-nums">{c.bySection[sec].toLocaleString()} questions</p>
                    </div>
                    <ul className="mt-6 grid gap-3">
                      {TAXONOMY[sec].map((d) => {
                        const n = c.byDomain[d.domain] ?? 0;
                        return (
                          <li key={d.domain} className="rounded-xl border border-line bg-white p-4">
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="font-medium text-ink">{d.domain}</span>
                              <span className="text-muted tabular-nums">{n.toLocaleString()}</span>
                            </div>
                            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                              <div className={`lp-bar h-full rounded-full ${sec === "math" ? "bg-red" : "bg-gold"}`} style={{ width: `${Math.max(3, (n / max) * 100)}%` }} />
                            </div>
                            <p className="mt-2.5 text-[13px] text-muted">{d.skills.length} {d.skills.length === 1 ? "skill" : "skills"}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              <div style={idx(2)} className="lp-stagger grid gap-4">
                <div className="lp-lift rounded-2xl border border-line bg-surface p-6 sm:p-7">
                  <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">Three difficulty levels</h3>
                  <div className="mt-6 flex h-28 items-end gap-3">
                    {(["E", "M", "H"] as Difficulty[]).map((d) => (
                      <div key={d} className="flex h-full flex-1 flex-col justify-end">
                        <div className={`rounded-lg ${d === "E" ? "bg-gold-100" : d === "M" ? "bg-gold" : "bg-red"}`} style={{ height: `${(byDiff[d] / Math.max(byDiff.E, byDiff.M, byDiff.H)) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <dl className="mt-3 flex gap-3">
                    {(["E", "M", "H"] as Difficulty[]).map((d) => (
                      <div key={d} className="flex-1">
                        <dt className="text-[13px] text-muted">{DIFFICULTY_LABEL[d]}</dt>
                        <dd className="font-medium text-ink tabular-nums">{byDiff[d].toLocaleString()}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
                  <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">Any equivalent answer counts</h3>
                  <ul className="mt-5 grid gap-2">
                    {["0.5", ".5", "1/2"].map((v) => (
                      <li key={v} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-2.5">
                        <span className="font-mono text-[16px] text-ink">{v}</span>
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ok"><ICheckCircle className="h-4 w-4" /> Correct</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[14px] leading-relaxed text-muted">Math answers are computed by the program, so type-in questions accept every equivalent form.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Try a question */}
        {items.length > 0 && (
          <section className="border-t border-line bg-surface">
            <div className={`${WRAP} grid items-start gap-x-16 gap-y-28 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]`}>
              <Reveal>
                <Tag>Live question</Tag>
                <h2 className={`${H2} max-w-[14ch]`}>Answer one <Hl>right now</Hl></h2>
                <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.55] text-muted">
                  These three come straight from the bank. Pick an answer and you get what every question gives you:
                </p>
                <ul className="mt-6 grid max-w-[46ch] gap-3 text-[16px] text-ink">
                  {["Marked the moment you answer", "A step-by-step explanation, right or wrong", "No account, no email"].map((t) => (
                    <li key={t} className="flex items-start gap-3"><ICheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-red" /> {t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={150}>
                <LandingQuestion items={items} />
              </Reveal>
            </div>
          </section>
        )}

        {/* Mock tests */}
        <section id="tests" className="scroll-mt-20 border-t border-line">
          <div className={`${WRAP} py-20 sm:py-28`}>
            <SectionHead
              tag="Mock tests"
              title={<>Sit the full test before <Hl>test day</Hl></>}
              actions={<LinkButton href="/tests" variant="secondary">See the practice tests <IArrowR className="h-4 w-4" /></LinkButton>}
            >
              {testQuestions} questions in {testLength}, timed, with two modules per section. Module 2 adapts to how you did on module 1, just like test day.
            </SectionHead>

            <Reveal stagger className="mt-12 rounded-2xl border border-line bg-surface p-4 sm:p-6">
              <ol className="grid gap-2 md:flex">
                {MODULES.map((m, i) => (
                  <li key={i} style={{ flexGrow: m.minutes, ...idx(i) }} className={`lp-stagger rounded-xl border bg-white p-5 md:basis-0 ${m.section === "rw" ? "border-gold-100" : "border-red-100"}`}>
                    <div className={`h-1.5 w-10 rounded-full ${m.section === "rw" ? "bg-gold" : "bg-red"}`} />
                    <p className="mt-4 text-[13px] text-muted">{SECTION_LABEL[m.section]}</p>
                    <p className="text-[20px] font-medium tracking-[-0.01em] text-ink">Module {(i % 2) + 1}</p>
                    <p className="mt-8 font-mono text-[28px] leading-none text-ink tabular-nums">{m.minutes}:00</p>
                    <p className="mt-2 text-[14px] text-muted tabular-nums">{m.n} questions{i % 2 ? ", adaptive" : ""}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <h3 id="how" className="sr-only">How it works</h3>
            <Reveal stagger className="mt-4">
            <ol className="grid overflow-hidden rounded-2xl border border-line md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} style={idx(i)} className={`lp-stagger p-6 sm:p-7 ${i ? "border-t border-line md:border-l md:border-t-0" : ""}`}>
                  <p className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 font-mono text-[14px] text-red">{i + 1}</p>
                  <p className="mt-4 text-[18px] font-medium tracking-[-0.01em] text-ink">{t}</p>
                  <p className="mt-1.5 leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ol>
            </Reveal>
          </div>
        </section>

        {/* Tools a free account adds */}
        <section id="tools" className="scroll-mt-20 border-t border-line">
          <div className={`${WRAP} py-20 sm:py-28`}>
            <SectionHead
              tag="Free account"
              title={<>Sign up and it <Hl>keeps track</Hl> for you</>}
              actions={!user && <LinkButton href="/signup">Create free account <IArrowR className="h-4 w-4" /></LinkButton>}
            >
              You can practice from the question bank right away. A free account saves your progress and adds four tools.
            </SectionHead>

            <Reveal stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr]">
              <Tile
                title="Mistake review"
                i={0}
                visual={
                  <ul className="grid w-full max-w-md grid-cols-[minmax(0,1fr)] gap-2">
                    {missed.map((s) => (
                      <li key={s} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-card">
                        <IXCircle className="h-5 w-5 shrink-0 text-bad" />
                        <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{s}</span>
                        <span className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-[13px] font-medium text-red">Retry</span>
                      </li>
                    ))}
                  </ul>
                }
              >
                Every question you miss is saved automatically. Retry them until they stick.
              </Tile>

              <Tile
                title="Predicted score"
                i={1}
                visual={
                  <div className="flex w-full max-w-xs items-center gap-6 rounded-2xl border border-line bg-white p-5 shadow-card">
                    <Ring value={0.72} size={92} stroke={9} label="1380" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-muted">Example estimate</p>
                      {[["Math", 0.76, "bg-red"], ["Reading and Writing", 0.68, "bg-gold"]].map(([l, v, cls]) => (
                        <div key={l as string} className="mt-3">
                          <p className="truncate text-[13px] text-ink">{l}</p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className={`lp-bar h-full rounded-full ${cls}`} style={{ width: `${(v as number) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              >
                See an estimated score that updates as you practice, with a breakdown by section and domain.
              </Tile>

              <Tile
                title="Vocabulary flashcards"
                i={3}
                className="lg:order-4"
                visual={
                  <div className="relative w-full max-w-sm">
                    <div className="absolute inset-x-4 -bottom-2 h-full rounded-2xl border border-line bg-white" aria-hidden="true" />
                    <div className="relative rounded-2xl border border-line bg-white p-6 text-center shadow-card">
                      <p className="text-[28px] font-medium tracking-[-0.02em] text-ink">{word.word}</p>
                      <p className="mt-0.5 text-[13px] italic text-muted">{word.pos}</p>
                      <p className="mt-4 border-t border-line pt-4 text-[15px] text-ink-2">{word.def}</p>
                    </div>
                  </div>
                }
              >
                High-value words with clear definitions and example sentences. Track what you&apos;ve mastered.
              </Tile>

              <Tile
                title="Daily questions and streaks"
                i={2}
                className="lg:order-3"
                visual={
                  <div className="grid w-full max-w-md grid-cols-[minmax(0,1fr)] gap-2">
                    {(["math", "rw"] as Section[]).map((sec) => (
                      <div key={sec} className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 ${sec === "math" ? "bg-red-50" : "bg-gold-50"}`}>
                        <div className="min-w-0">
                          <p className={`text-[13px] ${sec === "math" ? "text-red" : "text-gold-700"}`}>Today, {SECTION_LABEL[sec]}</p>
                          <p className="truncate text-[15px] font-medium text-ink">{daily[sec].skill.length > 36 ? daily[sec].domain : daily[sec].skill}</p>
                        </div>
                        <span className="shrink-0 text-[13px] font-medium text-ink">Solve</span>
                      </div>
                    ))}
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 shadow-card">
                      <span className="text-gold"><IFireSolid className="h-5 w-5" /></span>
                      <span className="mr-auto text-[14px] text-ink">Your streak</span>
                      {[1, 1, 1, 1, 1, 0, 0].map((on, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${on ? "bg-gold" : "bg-surface-2"}`} />)}
                    </div>
                  </div>
                }
              >
                Two fresh questions every day keep your skills sharp and your streak alive.
              </Tile>
            </Reveal>
          </div>
        </section>

        {/* Made by CodeStarters */}
        <section className="border-t border-line">
          <div className={`${WRAP} py-20 sm:py-28`}>
            <Reveal className="grid items-center gap-8 rounded-3xl border border-line bg-surface p-8 sm:p-12 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-12">
              <div className="grid h-24 w-24 place-items-center rounded-2xl border border-line bg-white sm:h-28 sm:w-28">
                <Image src="/codestarters-logo.png" alt="CodeStarters logo" width={72} height={72} className="h-16 w-16 sm:h-[72px] sm:w-[72px]" />
              </div>
              <div>
                <h2 className="text-[30px] leading-[1.1] font-medium tracking-[-0.03em] text-ink sm:text-[40px]">Made by <Hl>CodeStarters</Hl></h2>
                <p className="mt-4 max-w-[62ch] text-[17px] leading-[1.6] text-muted">
                  ScholarSAT is a CodeStarters tool, built by CodeStarters, a student-led nonprofit that makes computer science and AI accessible to every young student.
                </p>
              </div>
              <a href={CODESTARTERS} target="_blank" rel="noopener noreferrer" className={`${btn("secondary", "lg")} justify-self-start`}>
                Visit codestarters.org <IArrowR className="h-4 w-4" />
              </a>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line">
          <div className={`${WRAP} grid gap-x-16 gap-y-8 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]`}>
            <Reveal>
              <Tag>FAQ</Tag>
              <h2 className={H2}>Questions, <Hl>answered</Hl></h2>
            </Reveal>
            <Reveal delay={120} className="border-b border-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group border-t border-line [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium text-ink">
                    {q}
                    <span aria-hidden="true" className="shrink-0 text-[22px] leading-none font-normal text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-[62ch] pb-6 leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Closing call to action */}
        <section className={`${WRAP} pb-20 sm:pb-28`}>
          <Reveal className="group relative grid overflow-hidden rounded-3xl bg-red text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="pattern-grid pointer-events-none absolute inset-0 text-white/[0.07]" />
            <div className="relative p-8 sm:p-14">
              <div className="grid h-[88px] w-[88px] place-items-center rounded-2xl bg-white"><Owl size={64} /></div>
              <h2 className="mt-8 max-w-[14ch] text-[36px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-[52px]">Your next point starts with one question.</h2>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-medium text-red hover:bg-gold-50">
                  {user ? "Back to practice" : "Create your free account"} <IArrowR className="h-4 w-4" />
                </Link>
                <Link href="/practice" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-[15px] font-medium text-white hover:bg-white/10">
                  Practice without an account
                </Link>
              </div>
            </div>
            <div className="relative hidden min-h-[380px] lg:block" aria-hidden="true">
              <Image src="/landing/tests.webp" alt="" width={2040} height={1275} sizes="900px" className="absolute left-0 top-14 w-[900px] max-w-none rounded-tl-xl border border-black/20 shadow-[0_-8px_60px_rgb(0_0_0/0.28)]" />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="overflow-hidden border-t border-line">
        <div className={`${WRAP} grid gap-10 py-14 text-sm text-muted md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]`}>
          <div>
            <Logo size={30} />
            <a href={CODESTARTERS} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-fit items-center gap-2 text-[13px] font-medium text-ink hover:text-red">
              <Image src="/codestarters-logo.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" /> A CodeStarters tool
            </a>
            <p className="mt-3 max-w-sm text-xs leading-relaxed">SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, ScholarSAT. All ScholarSAT questions are original.</p>
          </div>
          <nav aria-label="Practice" className="grid content-start gap-3">
            <p className="font-medium text-ink">Practice</p>
            <Link href="/practice" className="hover:text-ink">Question Bank</Link>
            <Link href="/tests" className="hover:text-ink">Practice Tests</Link>
            <Link href="/vocab" className="hover:text-ink">Vocabulary</Link>
            <Link href="/resources" className="hover:text-ink">Resources</Link>
          </nav>
          <nav aria-label="Account" className="grid content-start gap-3">
            <p className="font-medium text-ink">Account</p>
            <Link href="/signup" className="hover:text-ink">Create free account</Link>
            <Link href="/login" className="hover:text-ink">Log in</Link>
          </nav>
          <nav aria-label="Project" className="grid content-start gap-3">
            <p className="font-medium text-ink">Project</p>
            <a href={REPO} className="hover:text-ink" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={CODESTARTERS} className="hover:text-ink" target="_blank" rel="noopener noreferrer">CodeStarters</a>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </nav>
        </div>
        <p aria-hidden="true" className="pointer-events-none -mb-[0.24em] select-none text-center text-[19.5vw] leading-none font-medium tracking-[-0.06em] text-surface-2">
          Scholar<span className="text-red-100">SAT</span>
        </p>
      </footer>
    </div>
  );
}
