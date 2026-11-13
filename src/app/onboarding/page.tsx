import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = { title: "Build your plan" };
export const dynamic = "force-dynamic";

/** Works signed in (saves to the account) and signed out (a full demo that carries over after signup). */
export default async function OnboardingPage() {
  const user = await getUser();
  const focus: string[] = user?.focus ? (() => { try { return JSON.parse(user.focus); } catch { return []; } })() : [];
  return (
    <Onboarding
      signedIn={!!user}
      firstName={user?.name.split(" ")[0] ?? ""}
      initial={user ? { currentScore: user.current_score, targetScore: user.target_score, gradClass: user.grad_class, testDate: user.test_date, studyMinutes: user.study_minutes, focus } : undefined}
    />
  );
}
