import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { VOCAB } from "@/data/vocab";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Log in to save progress", 401);
  const b = await req.json().catch(() => ({}));
  const word = String(b.word ?? "");
  if (!VOCAB.some((v) => v.word === word)) return bad("Unknown word");
  db.prepare("INSERT INTO vocab_progress (user_id, word, known) VALUES (?, ?, ?) ON CONFLICT(user_id, word) DO UPDATE SET known = excluded.known").run(user.id, word, b.known ? 1 : 0);
  return json({ ok: true });
}
