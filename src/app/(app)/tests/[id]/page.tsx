import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTest } from "@/lib/tests";
import { TestRunner } from "@/components/TestRunner";

export const metadata: Metadata = { title: "Practice Test" };

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const t = getTest(user.id, id);
  if (!t) notFound();
  if (t.finished_at) redirect(`/tests/${id}/report`);
  return <TestRunner id={id} />;
}
