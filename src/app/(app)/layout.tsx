import { AppShell } from "@/components/AppShell";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return <AppShell user={user}>{children}</AppShell>;
}
