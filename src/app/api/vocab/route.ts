import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { VOCAB } from "@/data/vocab";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Log in to save progress", 401);
  const b = await req.json().catch(() => ({}));
  const word = String(b.word ?? "").trim().toLowerCase();
  if (!VOCAB.some((v) => v.word.toLowerCase() === word)) return bad("Unknown word");

  const existing = db.prepare("SELECT known, starred FROM vocab_progress WHERE user_id = ? AND word = ?").get(user.id, word) as { known: number; starred: number } | undefined;

  const knownVal = b.known !== undefined ? (b.known ? 1 : 0) : (existing?.known ?? 0);
  const starredVal = b.starred !== undefined ? (b.starred ? 1 : 0) : (existing?.starred ?? 0);

  db.prepare(`
    INSERT INTO vocab_progress (user_id, word, known, starred)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, word) DO UPDATE SET known = excluded.known, starred = excluded.starred
  `).run(user.id, word, knownVal, starredVal);

  return json({ ok: true, word, known: knownVal === 1, starred: starredVal === 1 });
}
