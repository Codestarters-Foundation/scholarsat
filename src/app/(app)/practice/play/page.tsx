import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { BY_ID, filterQuestions } from "@/lib/bank";
import { statusSets } from "@/lib/stats";
import type { Difficulty, Section } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import { PracticePlayer } from "@/components/PracticePlayer";

export const metadata: Metadata = { title: "Practice" };

type SP = Record<string, string | undefined>;

export default async function Play({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getUser();
  let ids: string[];
  let title = sp.title ?? "Practice session";

  if (sp.ids) {
    ids = sp.ids.split(",").filter((id) => BY_ID.has(id));
  } else {
    const section = (sp.section === "rw" ? "rw" : "math") as Section;
    const skills = sp.skills?.split("|").filter(Boolean);
    const difficulty = sp.difficulty ? ([...sp.difficulty].filter((d) => "EMH".includes(d)) as Difficulty[]) : undefined;
    let pool = filterQuestions({ section, domain: sp.domain, skill: sp.skill, difficulty });
    if (skills?.length) pool = pool.filter((q) => skills.includes(q.skill));
    if (user && sp.status && sp.status !== "all") {
      const st = statusSets(user.id);
      pool = pool.filter((q) =>
        sp.status === "unanswered" ? !st.answered.has(q.id) : sp.status === "incorrect" ? st.incorrect.has(q.id) : sp.status === "bookmarked" ? st.bookmarks.has(q.id) : true,
      );
    }
    // shuffle (Fisher–Yates)
    const arr = pool.map((q) => q.id);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const limit = Number(sp.limit ?? 20);
    ids = limit > 0 ? arr.slice(0, limit) : arr;
    title = sp.skill ?? sp.domain ?? (skills?.length === 1 ? skills[0] : `${SECTION_LABEL[section]} practice`);
  }

  return <PracticePlayer ids={ids} signedIn={!!user} title={title} />;
}
