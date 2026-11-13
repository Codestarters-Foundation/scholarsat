import { db } from "@/lib/db";
import { destroySession, getUser, hashPassword, verifyPassword } from "@/lib/auth";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Not logged in", 401);
  const b = await req.json().catch(() => ({}));
  if (b.action === "profile") {
    const name = String(b.name ?? "").trim().slice(0, 60) || user.name;
    const target = b.target_score ? Math.min(1600, Math.max(400, Math.round(Number(b.target_score) / 10) * 10)) : null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.test_date ?? "")) ? String(b.test_date) : null;
    db.prepare("UPDATE users SET name = ?, target_score = ?, test_date = ? WHERE id = ?").run(name, target, date, user.id);
    return json({ ok: true });
  }
  if (b.action === "password") {
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (!(await verifyPassword(String(b.current ?? ""), row.password_hash))) return bad("Current password is incorrect.");
    if (String(b.next ?? "").length < 8) return bad("New password must be at least 8 characters.");
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(String(b.next)), user.id);
    return json({ ok: true });
  }
  if (b.action === "reset") {
    db.prepare("DELETE FROM attempts WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM tests WHERE user_id = ?").run(user.id);
    return json({ ok: true });
  }
  if (b.action === "delete") {
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (!(await verifyPassword(String(b.password ?? ""), row.password_hash))) return bad("Password is incorrect.");
    await destroySession();
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    return json({ ok: true });
  }
  return bad("Unknown action");
}
