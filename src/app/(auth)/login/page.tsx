import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default function Login() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mb-8 mt-2 text-muted">Log in to pick up where you left off.</p>
      <AuthForm mode="login" />
    </>
  );
}
