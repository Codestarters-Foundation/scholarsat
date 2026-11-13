import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { QUESTIONS } from "@/lib/bank";
import { statusSets } from "@/lib/stats";
import type { Difficulty } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import { PracticeFilters } from "@/components/PracticeFilters";

export const metadata: Metadata = { title: "Question Bank" };

export default async function PracticePage() {
  const user = await getUser();
  const counts: Record<string, Record<Difficulty, number>> = {};
  for (const q of QUESTIONS) (counts[q.skill] ??= { E: 0, M: 0, H: 0 })[q.difficulty]++;
  const st = user ? statusSets(user.id) : null;
  return (
    <>
      <PageTitle title="Question Bank" sub={`${QUESTIONS.length.toLocaleString()} free questions with full explanations. Pick skills, set difficulty, and go.`} />
      <PracticeFilters counts={counts} signedIn={!!user} statusCounts={st ? { incorrect: st.incorrect.size, bookmarks: st.bookmarks.size } : undefined} />
    </>
  );
}
