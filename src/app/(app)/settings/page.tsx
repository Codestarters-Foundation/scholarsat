import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { googleEnabled } from "@/lib/google";
import { PageTitle } from "@/components/ui";
import { SettingsForms } from "@/components/SettingsForms";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const row = db.prepare("SELECT password_hash, google_sub FROM users WHERE id = ?").get(user.id) as { password_hash: string; google_sub: string | null };
  return (
    <div className="animate-rise">
      <PageTitle title="Settings" sub="Your goal, your account, your data." />
      {sp.google === "in_use" && <p role="alert" className="mb-5 rounded-xl border border-bad-100 bg-bad-50 px-4 py-3 text-sm text-bad">That Google account is already connected to a different ScholarSAT account.</p>}
      <SettingsForms
        user={{ name: user.name, email: user.email, target_score: user.target_score, test_date: user.test_date }}
        hasPassword={!!row.password_hash}
        googleLinked={!!row.google_sub}
        googleAvailable={googleEnabled()}
      />
    </div>
  );
}
