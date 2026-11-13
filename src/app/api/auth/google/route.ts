import { NextResponse } from "next/server";
import { OAUTH_COOKIE, googleEnabled, newPkce, publicUrl, redirectUri, safeNext } from "@/lib/google";
import { clientIp, rateLimit } from "@/lib/http";

/** Starts Google sign-in: stores state + PKCE verifier in a short-lived cookie, then redirects to Google. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleEnabled()) return NextResponse.redirect(publicUrl(req, "/login?error=google_disabled"));
  if (!rateLimit("google:" + clientIp(req), 30, 15 * 60_000)) return NextResponse.redirect(publicUrl(req, "/login?error=rate"));

  const { state, verifier, challenge } = newPkce();
  const next = safeNext(url.searchParams.get("next"));
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(auth);
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next, link: url.searchParams.get("link") === "1" }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
