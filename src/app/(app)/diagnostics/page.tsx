import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDiagnostics } from "@/lib/diagnostics";
import { getDailyPoll } from "@/lib/daily";
import { getDailyReveal } from "@/lib/daily-answer";
import { CalculatorButton, DiagnosticsView } from "@/components/diagnostics/DiagnosticsView";
import { DailyAnswerCard } from "@/components/diagnostics/DailyAnswerCard";
import { IRefresh } from "@/components/icons";

export const metadata: Metadata = { title: "Diagnostics" };
export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  const user = await requireUser();
  if (!user.onboarded_at) redirect("/onboarding");
  const d = getDiagnostics(user.id);
  const polls = { math: getDailyPoll("math", user.id), rw: getDailyPoll("rw", user.id) };
  const reveals = { math: getDailyReveal("math", user.id), rw: getDailyReveal("rw", user.id) };
  return (
    <div className="animate-rise">
      <Link href="/onboarding" className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg px-3 py-1.5 text-[13px] text-muted shadow-card hover:text-ink">
        <IRefresh className="h-4 w-4" /> Redo onboarding
      </Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-tight font-medium tracking-[-0.01em]">Diagnostics</h1>
          <p className="mt-1.5 text-[15px] text-muted">See where you stand, what to fix next, and every question you&apos;ve answered.</p>
        </div>
        <CalculatorButton />
      </div>
      <div className="mb-6">
        <DailyAnswerCard polls={polls} reveals={reveals} />
      </div>
      <DiagnosticsView {...d} goal={user.target_score} />
    </div>
  );
}
