import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, getUser, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/http";
import { OAUTH_COOKIE, exchangeCode, googleEnabled, publicUrl, redirectUri, upsertGoogleUser } from "@/lib/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (code: string) => {
    const r = NextResponse.redirect(publicUrl(req, `/login?error=${code}`));
    r.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return r;
  };
  if (!googleEnabled()) return fail("google_disabled");
  if (url.searchParams.get("error")) return fail("google_cancelled");

  const jar = await cookies();
  let saved: { state: string; verifier: string; next: string; link?: boolean } | null = null;
  try {
    saved = JSON.parse(jar.get(OAUTH_COOKIE)?.value ?? "null");
  } catch {}
  const code = url.searchParams.get("code");
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return fail("google_state");

  try {
    const profile = await exchangeCode(code, saved.verifier, redirectUri(req));
    const current = saved.link ? await getUser() : null;
    if (current) {
      // Connecting Google to the signed-in account from Settings.
      const owner = db.prepare("SELECT id FROM users WHERE google_sub = ?").get(profile.sub) as { id: number } | undefined;
      if (owner && owner.id !== current.id) return NextResponse.redirect(publicUrl(req, "/settings?google=in_use"));
      db.prepare("UPDATE users SET google_sub = ? WHERE id = ?").run(profile.sub, current.id);
      const r = NextResponse.redirect(publicUrl(req, saved.next));
      r.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
      return r;
    }
    const userId = upsertGoogleUser(profile);
    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent");
    const s = createSession(userId, { userAgent, ip });
    await setSessionCookie(s.token, s.expires);
    const r = NextResponse.redirect(publicUrl(req, saved.next));
    r.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return r;
  } catch (e) {
    console.error("[google sign-in]", e instanceof Error ? e.message : e);
    return fail("google");
  }
}
