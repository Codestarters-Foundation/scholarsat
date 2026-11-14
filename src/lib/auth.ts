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
  avatar?: string | null;
  theme?: string | null;
  accent_color?: string | null;
  compact_mode?: number | null;
  reduce_animations?: number | null;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function parseUserAgent(ua: string | null | undefined): { browser: string; os: string; deviceType: "desktop" | "mobile" | "tablet" | "other" } {
  if (!ua) return { browser: "Unknown Browser", os: "Unknown Device", deviceType: "desktop" };
  const str = ua.toLowerCase();

  let os = "Unknown OS";
  if (str.includes("windows nt 10") || str.includes("windows nt 11") || str.includes("windows")) os = "Windows";
  else if (str.includes("macintosh") || str.includes("mac os")) os = "macOS";
  else if (str.includes("iphone")) os = "iOS (iPhone)";
  else if (str.includes("ipad")) os = "iPadOS";
  else if (str.includes("android")) os = "Android";
  else if (str.includes("cros")) os = "ChromeOS";
  else if (str.includes("linux")) os = "Linux";

  let browser = "Browser";
  if (str.includes("edg/")) browser = "Microsoft Edge";
  else if (str.includes("chrome/") && !str.includes("edg/")) browser = "Google Chrome";
  else if (str.includes("safari/") && !str.includes("chrome/")) browser = "Apple Safari";
  else if (str.includes("firefox/")) browser = "Mozilla Firefox";
  else if (str.includes("opr/") || str.includes("opera/")) browser = "Opera";

  let deviceType: "desktop" | "mobile" | "tablet" | "other" = "desktop";
  if (str.includes("mobile") || str.includes("iphone") || (str.includes("android") && !str.includes("tablet"))) {
    deviceType = "mobile";
  } else if (str.includes("tablet") || str.includes("ipad")) {
    deviceType = "tablet";
  }

  return { browser, os, deviceType };
}

export function createSession(userId: number, meta?: { userAgent?: string | null; ip?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const now = Date.now();
  try {
    db.prepare("INSERT INTO sessions (token, user_id, expires_at, user_agent, ip, created_at, last_active) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      token, userId, expires, meta?.userAgent ?? null, meta?.ip ?? null, now, now
    );
  } catch {
    db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  }
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

export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function getUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.target_score, u.test_date, u.created_at, u.grad_class, u.current_score, u.study_minutes, u.focus, u.onboarded_at,
              u.avatar, u.theme, u.accent_color, u.compact_mode, u.reduce_animations, s.expires_at, s.last_active
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as (User & { expires_at: number; last_active?: number | null }) | undefined;
  if (!row || row.expires_at < Date.now()) return null;

  // Touch last_active throttled to at most once every 60 seconds
  if (!row.last_active || Date.now() - row.last_active > 60_000) {
    try {
      db.prepare("UPDATE sessions SET last_active = ? WHERE token = ?").run(Date.now(), token);
    } catch {}
  }

  const { expires_at: _e, last_active: _la, ...user } = row;
  void _e;
  void _la;
  return user;
}

export type ActiveSession = {
  id: string; // safe token identifier (first 12 chars)
  isCurrent: boolean;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "other";
  ip: string | null;
  createdAt: number;
  lastActive: number;
};

export async function getActiveSessions(userId: number): Promise<ActiveSession[]> {
  const currentToken = await getSessionToken();
  const now = Date.now();
  const rows = db
    .prepare("SELECT token, user_agent, ip, created_at, last_active, expires_at FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY last_active DESC")
    .all(userId, now) as {
    token: string;
    user_agent: string | null;
    ip: string | null;
    created_at: number | null;
    last_active: number | null;
    expires_at: number;
  }[];

  return rows.map((r) => {
    const { browser, os, deviceType } = parseUserAgent(r.user_agent);
    const createdAt = r.created_at ?? r.expires_at - SESSION_DAYS * 86400_000;
    const lastActive = r.last_active ?? createdAt;
    return {
      id: r.token.slice(0, 16),
      isCurrent: r.token === currentToken,
      browser,
      os,
      deviceType,
      ip: r.ip ? (r.ip === "::1" ? "127.0.0.1" : r.ip) : null,
      createdAt,
      lastActive,
    };
  });
}

export function revokeSessionById(userId: number, sessionId: string) {
  // Session IDs are prefix matches (first 16 chars)
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token LIKE ?").run(userId, `${sessionId}%`);
}

export function revokeOtherSessions(userId: number, currentToken: string) {
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(userId, currentToken);
}

export function revokeAllSessions(userId: number) {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
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
