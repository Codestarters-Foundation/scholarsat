import Link from "next/link";
import type { Metadata } from "next";
import { getActiveSessions, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { googleEnabled } from "@/lib/google";
import { PageTitle } from "@/components/ui";
import { SettingsForms } from "@/components/SettingsForms";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const row = db
    .prepare("SELECT password_hash, google_sub FROM users WHERE id = ?")
    .get(user.id) as { password_hash: string; google_sub: string | null };

  const sessions = await getActiveSessions(user.id);

  return (
    <div className="animate-rise max-w-4xl mx-auto">
      <PageTitle title="Settings" sub="Appearance, account security, and personalized study preferences." />

      {sp.google === "in_use" && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-bad-100 dark:border-bad/30 bg-bad-50 dark:bg-bad/15 px-4 py-3 text-sm text-bad"
        >
          That Google account is already connected to a different ScholarSAT account.
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition-colors hover:border-red-200">
        <div>
          <span className="block text-[15px] font-medium text-ink">Personalized study plan</span>
          <span className="text-sm text-muted">
            Update your target score, exam date, and daily study minutes with a guided walkthrough.
          </span>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-red hover:text-red hover:bg-surface-2"
        >
          Redo study plan →
        </Link>
      </div>

      <SettingsForms
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          target_score: user.target_score,
          test_date: user.test_date,
          avatar: user.avatar,
          theme: user.theme,
          accent_color: user.accent_color,
          compact_mode: user.compact_mode,
          reduce_animations: user.reduce_animations,
        }}
        hasPassword={!!row.password_hash}
        googleLinked={!!row.google_sub}
        googleAvailable={googleEnabled()}
        activeSessions={sessions}
      />
    </div>
  );
}
