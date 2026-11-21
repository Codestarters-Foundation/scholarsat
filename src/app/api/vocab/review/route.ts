import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { bad, json, rateLimit } from "@/lib/http";
import { VOCAB } from "@/data/vocab";
import { knownAfter, reviewCard, type SrsState } from "@/lib/srs";

const WORDS = new Set(VOCAB.map((v) => v.word.toLowerCase()));

type Row = { known: number; box: number | null; due_at: number | null; reps: number | null; lapses: number | null };

/**
 * Records one graded answer from the vocabulary Learn mode and returns the word's new schedule.
 * The server computes the schedule, so the client only ever says "right" or "wrong".
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Log in to save progress", 401);
  if (!rateLimit(`vocab-review:${user.id}`, 120, 60_000)) return bad("Slow down a little.", 429);
  const b = await req.json().catch(() => ({}));
  const word = String(b.word ?? "").trim().toLowerCase();
  if (!WORDS.has(word)) return bad("Unknown word");
  if (typeof b.correct !== "boolean") return bad("Missing result");

  const row = db
    .prepare("SELECT known, box, due_at, reps, lapses FROM vocab_progress WHERE user_id = ? AND word = ?")
    .get(user.id, word) as Row | undefined;
  // due_at is only set once a word has been through Learn mode; older rows (flashcard flags) start fresh.
  const prev: SrsState | undefined =
    row && row.due_at != null ? { box: row.box ?? 0, due: row.due_at, reps: row.reps ?? 0, lapses: row.lapses ?? 0 } : undefined;
  const next = reviewCard(prev, b.correct, Date.now());
  const known = knownAfter(row?.known === 1, next.box) ? 1 : 0;

  db.prepare(
    `INSERT INTO vocab_progress (user_id, word, known, starred, box, due_at, reps, lapses)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?)
     ON CONFLICT(user_id, word) DO UPDATE SET
       known = excluded.known, box = excluded.box, due_at = excluded.due_at,
       reps = excluded.reps, lapses = excluded.lapses`,
  ).run(user.id, word, known, next.box, next.due, next.reps, next.lapses);

  return json({ ok: true, word, ...next, known: known === 1 });
}
