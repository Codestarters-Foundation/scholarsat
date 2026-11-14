import { db } from "@/lib/db";
import {
  destroySession,
  getSessionToken,
  getUser,
  hashPassword,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSessionById,
  verifyPassword,
} from "@/lib/auth";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Not logged in", 401);
  const b = await req.json().catch(() => ({}));

  if (b.action === "appearance") {
    const validThemes = ["system", "light", "dark"];
    const validAccents = ["red", "gold", "blue", "green", "purple", "rose"];
    const theme = validThemes.includes(b.theme) ? b.theme : user.theme ?? "system";
    const accent = validAccents.includes(b.accent_color) ? b.accent_color : user.accent_color ?? "red";
    const compact = b.compact_mode ? 1 : 0;
    const reduceMotion = b.reduce_animations ? 1 : 0;

    db.prepare("UPDATE users SET theme = ?, accent_color = ?, compact_mode = ?, reduce_animations = ? WHERE id = ?").run(
      theme,
      accent,
      compact,
      reduceMotion,
      user.id
    );
    return json({ ok: true, theme, accent_color: accent, compact_mode: compact, reduce_animations: reduceMotion });
  }

  if (b.action === "avatar") {
    // avatar can be a preset id ("owl", "cap", "scholar", etc.) or a data URL (max 200KB) or empty to clear
    const avatar = String(b.avatar ?? "").trim();
    if (avatar.length > 300_000) return bad("Avatar image is too large. Please choose a smaller photo.");
    db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatar || null, user.id);
    return json({ ok: true, avatar: avatar || null });
  }

  if (b.action === "profile") {
    const name = String(b.name ?? "").trim().slice(0, 60) || user.name;
    const target = b.target_score ? Math.min(1600, Math.max(400, Math.round(Number(b.target_score) / 10) * 10)) : null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.test_date ?? "")) ? String(b.test_date) : null;
    db.prepare("UPDATE users SET name = ?, target_score = ?, test_date = ? WHERE id = ?").run(name, target, date, user.id);
    return json({ ok: true });
  }

  if (b.action === "display_name") {
    const name = String(b.name ?? "").trim().slice(0, 60);
    if (!name) return bad("Name cannot be empty.");
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user.id);
    return json({ ok: true, name });
  }

  if (b.action === "email") {
    const newEmail = String(b.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return bad("Please enter a valid email address.");
    if (newEmail === user.email.toLowerCase()) return json({ ok: true, email: user.email });

    // Check if new email is already in use
    const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(newEmail, user.id);
    if (existing) return bad("An account with that email address already exists.");

    // Verify password if user has one
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (row.password_hash) {
      if (!b.password || !(await verifyPassword(String(b.password), row.password_hash))) {
        return bad("Please enter your current password to change your email.");
      }
    }

    db.prepare("UPDATE users SET email = ? WHERE id = ?").run(newEmail, user.id);
    return json({ ok: true, email: newEmail });
  }

  if (b.action === "password") {
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    // Google-only accounts have no password yet and can set one directly.
    if (row.password_hash && !(await verifyPassword(String(b.current ?? ""), row.password_hash))) {
      return bad("Current password is incorrect.");
    }
    if (String(b.next ?? "").length < 8) return bad("New password must be at least 8 characters.");
    if (b.confirm && b.confirm !== b.next) return bad("Password confirmation does not match.");
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(String(b.next)), user.id);
    return json({ ok: true });
  }

  if (b.action === "revoke_session") {
    const sessionId = String(b.session_id ?? "");
    if (!sessionId) return bad("Invalid session ID");
    revokeSessionById(user.id, sessionId);
    return json({ ok: true });
  }

  if (b.action === "sign_out_others") {
    const currentToken = await getSessionToken();
    if (!currentToken) return bad("No active session");
    revokeOtherSessions(user.id, currentToken);
    return json({ ok: true });
  }

  if (b.action === "sign_out_all") {
    revokeAllSessions(user.id);
    await destroySession();
    return json({ ok: true });
  }

  if (b.action === "unlink_google") {
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (!row.password_hash) return bad("Set a password first so you can still log in.");
    db.prepare("UPDATE users SET google_sub = NULL WHERE id = ?").run(user.id);
    return json({ ok: true });
  }

  if (b.action === "reset") {
    db.prepare("DELETE FROM attempts WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM tests WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM vocab_progress WHERE user_id = ?").run(user.id);
    return json({ ok: true });
  }

  if (b.action === "delete") {
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (row.password_hash) {
      if (!(await verifyPassword(String(b.password ?? ""), row.password_hash))) return bad("Password is incorrect.");
    } else if (String(b.password ?? "").trim().toLowerCase() !== user.email.toLowerCase()) {
      return bad("Type your email address exactly to confirm.");
    }
    await destroySession();
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    return json({ ok: true });
  }

  return bad("Unknown action");
}
