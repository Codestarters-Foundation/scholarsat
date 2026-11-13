import { BY_ID } from "@/lib/bank";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Log in to save questions", 401);
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!BY_ID.has(id)) return bad("Unknown question", 404);
  const exists = db.prepare("SELECT 1 FROM bookmarks WHERE user_id = ? AND question_id = ?").get(user.id, id);
  if (exists) db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND question_id = ?").run(user.id, id);
  else db.prepare("INSERT INTO bookmarks (user_id, question_id, created_at) VALUES (?, ?, ?)").run(user.id, id, Date.now());
  return json({ bookmarked: !exists });
}
