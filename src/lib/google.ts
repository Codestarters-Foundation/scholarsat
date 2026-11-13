import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

/**
 * Google sign-in (OAuth 2.0 authorization code flow with PKCE).
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Authorized redirect URI in Google Cloud:
 *   ${SITE_URL}/api/auth/google/callback   (and http://localhost:3000/api/auth/google/callback for dev)
 */
export const OAUTH_COOKIE = "ss_google_oauth";

export function googleEnabled() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Absolute public URL for a path. Behind Caddy the request origin is the internal one, so prefer SITE_URL in production. */
export function publicUrl(req: Request, path: string) {
  const origin = process.env.SITE_URL && process.env.NODE_ENV === "production" ? process.env.SITE_URL : new URL(req.url).origin;
  return new URL(path, origin.replace(/\/$/, "") + "/");
}

export function redirectUri(req: Request) {
  return publicUrl(req, "/api/auth/google/callback").toString();
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}

export function newPkce() {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, verifier, challenge };
}

export type GoogleProfile = { sub: string; email: string; name: string };

/** Exchanges the code for tokens and returns the verified profile from the ID token. */
export async function exchangeCode(code: string, verifier: string, redirect: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("no id_token");
  // The ID token came straight from Google's token endpoint over TLS, so its signature
  // doesn't need re-verifying (per Google's OpenID Connect docs); we still check the claims.
  const claims = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as {
    iss: string; aud: string; exp: number; sub: string; email?: string; email_verified?: boolean; name?: string; given_name?: string;
  };
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)) throw new Error("bad iss");
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("bad aud");
  if (claims.exp * 1000 < Date.now()) throw new Error("expired");
  if (!claims.email || !claims.email_verified) throw new Error("email not verified");
  return {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    name: (claims.given_name || claims.name || claims.email.split("@")[0]).slice(0, 60),
  };
}

/** Finds the user for a Google profile, linking by verified email or creating a new account. */
export function upsertGoogleUser(p: GoogleProfile): number {
  const bySub = db.prepare("SELECT id FROM users WHERE google_sub = ?").get(p.sub) as { id: number } | undefined;
  if (bySub) return bySub.id;
  const byEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(p.email) as { id: number } | undefined;
  if (byEmail) {
    // Email signups aren't verified, so an existing password could belong to someone who
    // pre-registered this address. Google has proven ownership: drop the old password and
    // sessions. The owner can set a new password in Settings.
    db.transaction(() => {
      db.prepare("UPDATE users SET google_sub = ?, password_hash = '' WHERE id = ?").run(p.sub, byEmail.id);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(byEmail.id);
    })();
    return byEmail.id;
  }
  // Google-only accounts have no password ('' never matches a bcrypt hash).
  const info = db.prepare("INSERT INTO users (email, name, password_hash, google_sub, created_at) VALUES (?, ?, '', ?, ?)").run(p.email, p.name, p.sub, Date.now());
  return Number(info.lastInsertRowid);
}
