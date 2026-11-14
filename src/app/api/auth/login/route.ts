import { db } from "@/lib/db";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { bad, clientIp, json, rateLimit } from "@/lib/http";

export async function POST(req: Request) {
  if (!rateLimit("login:" + clientIp(req), 20, 15 * 60_000)) return bad("Too many attempts. Wait a few minutes and try again.", 429);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const u = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as { id: number; password_hash: string } | undefined;
  if (u && !u.password_hash) return bad("This account uses Google sign-in. Use “Continue with Google” above.", 401);
  if (!u || !(await verifyPassword(password, u.password_hash))) return bad("That email and password don't match.", 401);
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");
  const s = createSession(u.id, { userAgent, ip });
  await setSessionCookie(s.token, s.expires);
  return json({ ok: true });
}
