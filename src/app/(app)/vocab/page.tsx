import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { VOCAB } from "@/data/vocab";
import { PageTitle } from "@/components/ui";
import { VocabStudy } from "@/components/VocabStudy";

export const metadata: Metadata = { title: "Vocabulary" };
export const dynamic = "force-dynamic";

export default async function VocabPage() {
  const user = await getUser();

  let known: string[] = [];
  let starred: string[] = [];

  if (user) {
    const rows = db
      .prepare("SELECT word, known, starred FROM vocab_progress WHERE user_id = ?")
      .all(user.id) as { word: string; known: number; starred: number }[];
    known = rows.filter((r) => r.known === 1).map((r) => r.word);
    starred = rows.filter((r) => r.starred === 1).map((r) => r.word);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageTitle
        title="SAT Vocabulary"
        sub="Master high-frequency Digital SAT words, tricky words in context, and academic terminology in bite-sized sessions."
      />
      <VocabStudy words={VOCAB} initialKnown={known} initialStarred={starred} signedIn={!!user} />
    </div>
  );
}
