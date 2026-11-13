import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { BY_ID } from "@/lib/bank";
import { statusSets } from "@/lib/stats";
import { DIFFICULTY_LABEL, SECTION_LABEL } from "@/lib/types";
import { Badge, Card, DIFF_TONE, LinkButton, PageTitle } from "@/components/ui";
import { IArrowR } from "@/components/icons";

export const metadata: Metadata = { title: "Review" };

export default async function Review() {
  const user = await requireUser();
  const st = statusSets(user.id);
  const missed = [...st.incorrect].map((id) => BY_ID.get(id)).filter(Boolean).map((q) => q!);
  const saved = [...st.bookmarks].map((id) => BY_ID.get(id)).filter(Boolean).map((q) => q!);

  const List = ({ items, empty }: { items: typeof missed; empty: string }) =>
    items.length ? (
      <ul className="divide-y divide-line">
        {items.slice(0, 100).map((q) => (
          <li key={q.id}>
            <Link href={`/practice/play?ids=${q.id}&title=Review`} className="flex items-center justify-between gap-4 py-3 hover:text-red">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{q.skill}</p>
                <p className="text-xs text-muted">{SECTION_LABEL[q.section]} · {q.domain}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2"><Badge tone={DIFF_TONE[q.difficulty]}>{DIFFICULTY_LABEL[q.difficulty]}</Badge><IArrowR className="h-4 w-4 text-muted" /></div>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <p className="py-6 text-sm text-muted">{empty}</p>
    );

  return (
    <>
      <PageTitle title="Review" sub="Turn mistakes into points. Questions you missed stay here until you get them right." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Missed questions <span className="text-muted">({missed.length})</span></h2>
            {missed.length > 0 && <LinkButton href={`/practice/play?ids=${missed.slice(0, 50).map((q) => q.id).join(",")}&title=${encodeURIComponent("Mistake review")}`}>Retry all</LinkButton>}
          </div>
          <List items={missed} empty="Nothing here yet. Questions you answer incorrectly will show up here." />
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Saved questions <span className="text-muted">({saved.length})</span></h2>
            {saved.length > 0 && <LinkButton variant="secondary" href={`/practice/play?ids=${saved.slice(0, 50).map((q) => q.id).join(",")}&title=Saved`}>Practice saved</LinkButton>}
          </div>
          <List items={saved} empty="Tap “Save” on any question to keep it here for later." />
        </Card>
      </div>
    </>
  );
}
