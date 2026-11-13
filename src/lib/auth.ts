import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "ss_session";
const SESSION_DAYS = 30;

export type User = {
  id: number;
  email: string;
  name: string;
  target_score: number | null;
  test_date: string | null;
  created_at: number;
  grad_class: string | null;
  current_score: number | null;
  study_minutes: number | null;
  /** JSON array of focus domains */
  focus: string | null;
  onboarded_at: number | null;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  return { token, expires };
}

export async function setSessionCookie(token: string, expires: number) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires: new Date(expires),
  });
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.target_score, u.test_date, u.created_at, u.grad_class, u.current_score, u.study_minutes, u.focus, u.onboarded_at, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as (User & { expires_at: number }) | undefined;
  if (!row || row.expires_at < Date.now()) return null;
  const { expires_at: _e, ...user } = row;
  void _e;
  return user;
}

export async function requireUser(): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(SESSION_COOKIE);
}
