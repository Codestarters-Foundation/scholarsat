import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { BY_ID } from "@/lib/bank";
import { statusSets } from "@/lib/stats";
import { SECTION_LABEL } from "@/lib/types";
import { DiffBadge, EmptyState, HeaderCard, LinkButton, PageTitle } from "@/components/ui";
import { IBookmark, IChevR, IRefresh } from "@/components/icons";

export const metadata: Metadata = { title: "Review" };

export default async function Review() {
  const user = await requireUser();
  const st = statusSets(user.id);
  const missed = [...st.incorrect].map((id) => BY_ID.get(id)).filter(Boolean).map((q) => q!);
  const saved = [...st.bookmarks].map((id) => BY_ID.get(id)).filter(Boolean).map((q) => q!);

  const List = ({ items }: { items: typeof missed }) => (
    <ul className="divide-y divide-line">
      {items.slice(0, 100).map((q) => (
        <li key={q.id}>
          <Link href={`/practice/play?ids=${q.id}&title=Review`} className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium group-hover:text-red">{q.skill}</p>
              <p className="text-xs text-muted">{SECTION_LABEL[q.section]} · {q.domain}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2"><DiffBadge d={q.difficulty} /><IChevR className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" /></div>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="animate-rise">
      <PageTitle title="Review" sub="Turn mistakes into points. Missed questions stay here until you get them right." />
      <div className="grid gap-6 lg:grid-cols-2">
        <HeaderCard
          title={<>Missed questions <span className="ml-1 text-white/75 tabular-nums">{missed.length}</span></>}
          right={missed.length > 0 && <LinkButton size="sm" variant="secondary" href={`/practice/play?ids=${missed.slice(0, 50).map((q) => q.id).join(",")}&title=${encodeURIComponent("Mistake review")}`}>Retry all</LinkButton>}
          bodyClassName=""
        >
          {missed.length ? <List items={missed} /> : <EmptyState icon={<IRefresh />} title="Nothing to fix yet">Questions you answer incorrectly show up here.</EmptyState>}
        </HeaderCard>
        <HeaderCard
          tone="gold"
          title={<>Saved questions <span className="ml-1 text-white/75 tabular-nums">{saved.length}</span></>}
          right={saved.length > 0 && <LinkButton size="sm" variant="secondary" href={`/practice/play?ids=${saved.slice(0, 50).map((q) => q.id).join(",")}&title=Saved`}>Practice saved</LinkButton>}
          bodyClassName=""
        >
          {saved.length ? <List items={saved} /> : <EmptyState icon={<IBookmark />} title="No saved questions">Tap &ldquo;Save&rdquo; on any question to keep it here for later.</EmptyState>}
        </HeaderCard>
      </div>
    </div>
  );
}
