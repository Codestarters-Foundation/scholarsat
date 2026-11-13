import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/dashboard");
  return <AuthShell>{children}</AuthShell>;
}
