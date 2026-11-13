import { AppShell } from "@/components/AppShell";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const answered = user ? (db.prepare("SELECT COUNT(DISTINCT question_id) n FROM attempts WHERE user_id = ?").get(user.id) as { n: number }).n : 0;
  return <AppShell user={user} answered={answered}>{children}</AppShell>;
}
