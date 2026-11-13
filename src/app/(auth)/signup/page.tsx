import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create your account" };

export default function Signup() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Start practicing free</h1>
      <p className="mb-8 mt-2 text-muted">Track progress, save questions, and take full-length tests. No credit card, ever.</p>
      <AuthForm mode="signup" />
    </>
  );
}
