import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { BY_ID, filterQuestions } from "@/lib/bank";
import { statusSets } from "@/lib/stats";
import type { Difficulty, Section } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import { practiceOrder } from "@/lib/practice-order";
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
    if (sp.collection === "november-set" || sp.collection === "skill-workshop") pool = pool.filter(q => q.collection === sp.collection);
    if (skills?.length) pool = pool.filter((q) => skills.includes(q.skill));
    if (user && sp.status && sp.status !== "all") {
      const st = statusSets(user.id);
      pool = pool.filter((q) =>
        sp.status === "unanswered" ? !st.answered.has(q.id) : sp.status === "incorrect" ? st.incorrect.has(q.id) : sp.status === "bookmarked" ? st.bookmarks.has(q.id) : true,
      );
    }
    const limit = Number(sp.limit ?? 20);
    ids = practiceOrder(pool, Math.random, Number.isFinite(limit) ? Math.max(0,Math.floor(limit)) : 20);
    title = sp.collection === "november-set" ? `New ${SECTION_LABEL[section]} questions` : sp.skill ?? sp.domain ?? (skills?.length === 1 ? skills[0] : `${SECTION_LABEL[section]} practice`);
  }

  const items = ids.map((id) => ({ id, difficulty: BY_ID.get(id)!.difficulty }));
  const back = new URLSearchParams({ section: sp.section === "rw" ? "rw" : "math" });
  if (sp.collection === "skill-workshop") back.set("collection", sp.collection);
  if (sp.topic) back.set("topic", sp.topic);
  const backHref = "/practice?" + back;
  return <PracticePlayer items={items} signedIn={!!user} title={title} backHref={backHref} />;
}
