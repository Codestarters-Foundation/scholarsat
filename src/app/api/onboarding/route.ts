import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { sanitizeAnswers } from "@/lib/onboarding";

/** Saves onboarding answers and marks onboarding done. Sending `{ skip: true }` just marks it done. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Not logged in", 401);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();

  if (b.skip) {
    db.prepare("UPDATE users SET onboarded_at = ? WHERE id = ?").run(now, user.id);
    return json({ ok: true });
  }

  const a = sanitizeAnswers(b);
  // Keep any existing value for fields the student skipped.
  db.prepare(
    `UPDATE users SET
       target_score = COALESCE(?, target_score),
       test_date = COALESCE(?, test_date),
       current_score = COALESCE(?, current_score),
       grad_class = COALESCE(?, grad_class),
       study_minutes = COALESCE(?, study_minutes),
       focus = CASE WHEN ? IS NULL THEN focus ELSE ? END,
       onboarded_at = ?
     WHERE id = ?`,
  ).run(a.targetScore, a.testDate, a.currentScore, a.gradClass, a.studyMinutes, a.focus.length ? JSON.stringify(a.focus) : null, a.focus.length ? JSON.stringify(a.focus) : null, now, user.id);
  return json({ ok: true });
}
