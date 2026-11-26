import Link from "next/link";
import { getUser } from "@/lib/auth";
import { BY_ID } from "@/lib/bank";
import { db } from "@/lib/db";
import { loadSchedule } from "@/lib/miss-store";
import { whenLabel } from "@/lib/missed-loop";
import { LinkButton } from "@/components/ui";

/** A short banner for the Review page (and anywhere else): how many missed questions are due today. Hidden if there is nothing on the ladder. */
export async function DueTodayCard() {
  const user = await getUser();
  if (!user) return null;
  const now = Date.now();
  const s = loadSchedule(db, user.id, now, (id) => BY_ID.has(id));
  if (!s.learning) return null;
  const n = s.due.length;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-bg p-5 shadow-card">
      <div className="min-w-0">
        <p className="text-[17px] font-medium text-ink">{n ? `${n} missed question${n === 1 ? " is" : "s are"} due for review` : "You're caught up"}</p>
        <p className="mt-0.5 text-sm text-muted">
          {n ? "Missed questions come back after 1, 3 and 7 days. Right answers move them up." : `Next review ${whenLabel(s.upcoming[0].dueAt, now)}.`}{" "}
          <Link href="/review/today" className="text-red hover:underline">See schedule</Link>
        </p>
      </div>
      {n > 0 && (
        <LinkButton href={`/practice/play?ids=${s.due.slice(0, 20).map((d) => d.id).join(",")}&title=${encodeURIComponent("Due today")}`}>Review now</LinkButton>
      )}
    </div>
  );
}
