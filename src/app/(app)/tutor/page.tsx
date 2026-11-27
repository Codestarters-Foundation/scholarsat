import type { Metadata } from "next";
import Link from "next/link";
import { BY_ID, toPublic } from "@/lib/bank";
import { GuidedQuestion } from "@/components/GuidedQuestion";
import { IBook, ICalc } from "@/components/icons";
import "@/components/practice.css";

export const metadata: Metadata = { title: "AI tutor" };

export default async function TutorPage({ searchParams }: { searchParams: Promise<{ section?: string; connection?: string }> }) {
  const params = await searchParams;
  const math = params.section === "math";
  const q = BY_ID.get(math ? "m56bc0dd7" : "r5f0e707a");
  if (!q) throw new Error("The tutor practice question is missing.");
  return <div className="tutor-workbook">
    <link rel="preload" as="image" href="/landing/lunar/tutor-moon-480.webp" media="(max-width:680px)" />
    <header className="practice-heading"><div><h1>AI tutor</h1><p>Try a question with a hint, then work through the answer.</p></div></header>
    <nav className="subject-switch" aria-label="Tutor subject">
      <Link href="/tutor" scroll={false} aria-current={!math ? "page" : undefined}><IBook />Reading and Writing</Link>
      <Link href="/tutor?section=math" scroll={false} aria-current={math ? "page" : undefined}><ICalc />Math</Link>
    </nav>
    <GuidedQuestion key={q.id} q={toPublic(q)} planFirst={params.connection === "plan"} />
  </div>;
}
