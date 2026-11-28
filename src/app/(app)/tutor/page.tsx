import type { Metadata } from "next";
import Link from "next/link";
import { BY_ID, QUESTIONS, toPublic } from "@/lib/bank";
import { GuidedQuestion } from "@/components/GuidedQuestion";
import { PageTitle } from "@/components/ui";
import { IBook, ICalc, IRefresh } from "@/components/icons";
import "@/components/practice.css";

export const metadata: Metadata = { title: "AI tutor" };

const START = { rw: "r5f0e707a", math: "m56bc0dd7" } as const;

export default async function TutorPage({ searchParams }: { searchParams: Promise<{ section?: string; q?: string; connection?: string }> }) {
  const params = await searchParams;
  const section = params.section === "math" ? "math" : "rw";
  const picked = params.q ? BY_ID.get(params.q) : undefined;
  const q = picked && picked.section === section ? picked : BY_ID.get(START[section]);
  if (!q) throw new Error("The tutor practice question is missing.");
  // "Another question" jumps to a random multiple-choice question in the same subject.
  const pool = QUESTIONS.filter((x) => x.section === section && x.type === "mcq" && x.id !== q.id);
  const next = pool[Math.floor(Math.random() * pool.length)];
  const nextHref = `/tutor?${new URLSearchParams({ section, q: next.id })}`;
  return (
    <div className="tutor-workbook animate-rise">
      <PageTitle
        title="AI tutor"
        sub="Work a question, ask for a hint when you're stuck, then have it explained after you answer."
        action={<Link href={nextHref} scroll={false} className="tutor-invite"><IRefresh />Another question</Link>}
      />
      <nav className="subject-switch" aria-label="Tutor subject">
        <Link href="/tutor" scroll={false} aria-current={section === "rw" ? "page" : undefined}><IBook />Reading and Writing</Link>
        <Link href="/tutor?section=math" scroll={false} aria-current={section === "math" ? "page" : undefined}><ICalc />Math</Link>
      </nav>
      <GuidedQuestion key={q.id} q={toPublic(q)} planFirst={params.connection === "plan"} />
    </div>
  );
}
