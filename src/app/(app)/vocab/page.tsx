import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { VOCAB } from "@/data/vocab";
import { PageTitle } from "@/components/ui";
import { VocabStudy } from "@/components/VocabStudy";
import type { SrsState } from "@/lib/srs";

export const metadata: Metadata = { title: "Vocabulary" };
export const dynamic = "force-dynamic";

export default async function VocabPage() {
  const user = await getUser();

  let known: string[] = [];
  let starred: string[] = [];
  const srs: Record<string, SrsState> = {};

  if (user) {
    const rows = db
      .prepare("SELECT word, known, starred FROM vocab_progress WHERE user_id = ?")
      .all(user.id) as { word: string; known: number; starred: number }[];
    known = rows.filter((r) => r.known === 1).map((r) => r.word);
    starred = rows.filter((r) => r.starred === 1).map((r) => r.word);
    const srsRows = db
      .prepare("SELECT word, box, due_at, reps, lapses FROM vocab_progress WHERE user_id = ? AND due_at IS NOT NULL")
      .all(user.id) as { word: string; box: number; due_at: number; reps: number; lapses: number }[];
    for (const r of srsRows) srs[r.word] = { box: r.box, due: r.due_at, reps: r.reps, lapses: r.lapses };
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageTitle
        title="SAT Vocabulary"
        sub="Learn a word by finding the evidence for it in a passage."
      />
      <VocabStudy words={VOCAB} initialKnown={known} initialStarred={starred} initialSrs={srs} signedIn={!!user} />
    </div>
  );
}
