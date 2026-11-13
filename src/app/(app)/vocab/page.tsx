import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { VOCAB } from "@/data/vocab";
import { PageTitle } from "@/components/ui";
import { Flashcards } from "@/components/Flashcards";

export const metadata: Metadata = { title: "Vocabulary" };

export default async function VocabPage() {
  const user = await getUser();
  const known = user
    ? (db.prepare("SELECT word FROM vocab_progress WHERE user_id = ? AND known = 1").all(user.id) as { word: string }[]).map((r) => r.word)
    : [];
  return (
    <>
      <PageTitle title="Vocabulary" sub={`${VOCAB.length} high-value words that show up in SAT-style reading. Flip, learn, and track what you know.`} />
      <Flashcards words={VOCAB} initialKnown={known} signedIn={!!user} />
    </>
  );
}
