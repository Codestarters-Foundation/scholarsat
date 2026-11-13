import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { QUESTIONS } from "@/lib/bank";
import { statusSets, userStats } from "@/lib/stats";
import type { Difficulty } from "@/lib/types";
import { PracticeFilters, type SkillInfo } from "@/components/PracticeFilters";

export const metadata: Metadata = { title: "Question Bank" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  const st = user ? statusSets(user.id) : null;
  const stats = user ? userStats(user.id) : null;

  const skills: Record<string, SkillInfo> = {};
  for (const q of QUESTIONS) {
    const s = (skills[q.skill] ??= { total: 0, byDiff: { E: 0, M: 0, H: 0 } as Record<Difficulty, number>, answered: 0, correct: 0, wrong: 0 });
    s.total++;
    s.byDiff[q.difficulty]++;
  }
  if (stats) {
    for (const [k, v] of Object.entries(stats.bySkill)) {
      if (!skills[k]) continue;
      skills[k].answered = v.seen;
      skills[k].correct = v.correct;
      skills[k].wrong = v.seen - v.correct;
    }
  }

  return (
    <PracticeFilters
      initialSection={sp.section === "rw" ? "rw" : "math"}
      skills={skills}
      signedIn={!!user}
      statusCounts={st ? { incorrect: st.incorrect.size, bookmarks: st.bookmarks.size } : undefined}
    />
  );
}
