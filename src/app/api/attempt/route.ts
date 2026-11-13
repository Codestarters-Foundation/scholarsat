import { BY_ID, isCorrect } from "@/lib/bank";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const q = BY_ID.get(String(body.id ?? ""));
  if (!q) return bad("Unknown question", 404);
  const response = String(body.response ?? "").slice(0, 20);
  if (!response) return bad("No answer given");
  const correct = isCorrect(q, response);
  const user = await getUser();
  if (user) {
    const t = Number(body.timeMs);
    db.prepare("INSERT INTO attempts (user_id, question_id, response, correct, time_ms, source, created_at) VALUES (?, ?, ?, ?, ?, 'practice', ?)").run(
      user.id, q.id, response, correct ? 1 : 0, Number.isFinite(t) ? Math.min(Math.max(0, Math.round(t)), 3_600_000) : null, Date.now(),
    );
  }
  // How everyone answered this multiple-choice question (real attempts only; the count includes this one when signed in).
  let dist: Record<string, number> | undefined;
  if (q.type === "mcq") {
    dist = { A: 0, B: 0, C: 0, D: 0 };
    const rows = db.prepare("SELECT response, COUNT(*) n FROM attempts WHERE question_id = ? GROUP BY response").all(q.id) as { response: string; n: number }[];
    for (const r of rows) if (r.response in dist) dist[r.response] = r.n;
  }
  return json({ correct, answer: q.answer, explanation: q.explanation, saved: !!user, dist });
}
