import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Create your account" };

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-[34px] leading-tight font-medium tracking-[-0.02em]">Start practicing free</h1>
      <p className="mb-8 mt-2 text-[15px] text-muted">Track progress, save questions, and take full-length tests. No credit card.</p>
      <AuthForm mode="signup" google={googleEnabled()} error={sp.error} next={sp.next} />
    </>
  );
}
