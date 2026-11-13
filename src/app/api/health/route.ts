import { db } from "@/lib/db";
import { QUESTIONS } from "@/lib/bank";

export const dynamic = "force-dynamic";

export function GET() {
  db.prepare("SELECT 1").get();
  return Response.json({ ok: true, questions: QUESTIONS.length });
}
