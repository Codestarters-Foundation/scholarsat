import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDailyPoll } from "@/lib/daily";
import { utcDay } from "@/lib/bank";
import type { Section } from "@/lib/types";
import { DailyFullscreen } from "@/components/DailyFullscreen";

export const metadata: Metadata = { title: "Daily question" };
export const dynamic = "force-dynamic";

/** Full-screen daily question (outside the app shell, like the practice player). */
export default async function DailyPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== "math" && section !== "rw") notFound();
  const user = await requireUser();
  if (!user.onboarded_at) redirect("/onboarding");
  const polls = { math: getDailyPoll("math", user.id), rw: getDailyPoll("rw", user.id) };
  return <DailyFullscreen initial={polls} section={section as Section} dayNo={utcDay() - 20400} />;
}
