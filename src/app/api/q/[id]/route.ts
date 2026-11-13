import { BY_ID, toPublic } from "@/lib/bank";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = BY_ID.get(id);
  if (!q) return bad("Not found", 404);
  const user = await getUser();
  let bookmarked = false;
  let last: { response: string; correct: number } | undefined;
  if (user) {
    bookmarked = !!db.prepare("SELECT 1 FROM bookmarks WHERE user_id = ? AND question_id = ?").get(user.id, id);
    last = db.prepare("SELECT response, correct FROM attempts WHERE user_id = ? AND question_id = ? ORDER BY id DESC LIMIT 1").get(user.id, id) as typeof last;
  }
  return json({ question: toPublic(q), bookmarked, last: last ?? null });
}
