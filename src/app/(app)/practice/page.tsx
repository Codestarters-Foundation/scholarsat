import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { QUESTIONS } from "@/lib/bank";
import { statusSets } from "@/lib/stats";
import type { Difficulty } from "@/lib/types";
import { PracticeFilters, type SkillInfo } from "@/components/PracticeFilters";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ section?: string; topic?: string; collection?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  const stats = user ? statusSets(user.id) : null;

  const workshop = sp.collection === "skill-workshop";
  const skills: Record<string, SkillInfo> = {};
  for (const q of QUESTIONS) {
    if (workshop && q.collection !== "skill-workshop") continue;
    const s = (skills[q.skill] ??= { total: 0, fresh: 0, byDiff: { E: 0, M: 0, H: 0 } as Record<Difficulty, number>, answered: 0, correct: 0, wrong: 0 });
    s.total++;
    if(q.collection === "skill-workshop") s.fresh++;
    s.byDiff[q.difficulty]++;
    if (stats?.answered.has(q.id)) {
      s.answered++;
      if (stats.incorrect.has(q.id)) s.wrong++; else s.correct++;
    }
  }

  return (
    <PracticeFilters key={sp.section === "rw" ? "rw" : "math"} section={sp.section === "rw" ? "rw" : "math"} topic={sp.topic} workshop={workshop} skills={skills} />
  );
}
