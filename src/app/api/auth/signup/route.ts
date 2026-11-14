import { db } from "@/lib/db";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { bad, clientIp, json, rateLimit } from "@/lib/http";

export async function POST(req: Request) {
  if (!rateLimit("signup:" + clientIp(req), 10, 60 * 60_000)) return bad("Too many sign-ups from this network. Try again later.", 429);
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 60);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(body.password ?? "");
  if (!name) return bad("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Please enter a valid email address.");
  if (password.length < 8) return bad("Password must be at least 8 characters.");
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return bad("An account with that email already exists. Try logging in.", 409);
  const hash = await hashPassword(password);
  const info = db.prepare("INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)").run(email, name, hash, Date.now());
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");
  const s = createSession(Number(info.lastInsertRowid), { userAgent, ip });
  await setSessionCookie(s.token, s.expires);
  return json({ ok: true });
}
