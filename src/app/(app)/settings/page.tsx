import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { SettingsForms } from "@/components/SettingsForms";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const user = await requireUser();
  return (
    <>
      <PageTitle title="Settings" sub="Your goal, your account, your data." />
      <SettingsForms user={{ name: user.name, email: user.email, target_score: user.target_score, test_date: user.test_date }} />
    </>
  );
}
