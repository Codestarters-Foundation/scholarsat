import Image from "next/image";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden bg-red lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(193,145,47,0.35),transparent_55%)]" />
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center text-white">
          <div className="rounded-full bg-white p-6 shadow-2xl"><Image src="/logo.png" alt="" width={160} height={160} /></div>
          <p className="mt-10 max-w-md font-display text-3xl font-semibold leading-snug">Thousands of questions, real explanations, and full mock tests. All free.</p>
          <p className="mt-4 text-white/80">No trials. No paywalls. Just practice.</p>
        </div>
      </div>
    </div>
  );
}
