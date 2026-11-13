import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Log in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-[34px] leading-tight font-medium tracking-[-0.02em]">Welcome back</h1>
      <p className="mb-8 mt-2 text-[15px] text-muted">Log in to pick up where you left off.</p>
      <AuthForm mode="login" google={googleEnabled()} error={sp.error} next={sp.next} />
    </>
  );
}
