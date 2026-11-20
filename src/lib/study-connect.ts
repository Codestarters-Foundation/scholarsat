import "server-only";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getSessionToken } from "./auth";
import { db } from "./db";

const issuer = "https://auth.openai.com";
const keys = createRemoteJWKSet(new URL(issuer + "/.well-known/jwks.json"));
export const resource = "https://api.openai.com/v1";
const scopes = "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";
const cookie = "ss_study";
const secret = () => randomBytes(32).toString("base64url");
type Pending = {
  state: string;
  nonce: string;
  verifier: string;
  redirect: string;
  until: number;
};
type Connection = {
  owner: string | null;
  until: number;
  pending?: Pending;
  token?: string;
  client?: string;
  subject?: string;
  expires?: number;
};
declare global {
  var scholarConnections: Map<string, Connection> | undefined;
}
const sessions = (globalThis.scholarConnections ??= new Map<
  string,
  Connection
>());

export function localOrigin() {
  try {
    const url = new URL(process.env.SITE_URL ?? "");
    if (url.protocol === "http:" && url.hostname === "127.0.0.1")
      return url.origin;
  } catch {
    /* The local integration is opt-in. */
  }
  return null;
}
async function session(create = false) {
  const jar = await cookies();
  const owner = await getSessionToken();
  const id = jar.get(cookie)?.value;
  for (const [k, v] of sessions) if (v.until < Date.now()) sessions.delete(k);
  const existing = id && sessions.get(id);
  if (existing && existing.owner === owner) return existing;
  if (!create) return;
  const value: Connection = { owner, until: Date.now() + 8 * 3600_000 };
  const next = secret();
  sessions.set(next, value);
  jar.set(cookie, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 3600,
  });
  return value;
}
export async function startConnection(origin: string) {
  const s = (await session(true))!;
  db.exec(
    "CREATE TABLE IF NOT EXISTS study_host (id INTEGER PRIMARY KEY CHECK(id=1), host TEXT NOT NULL)",
  );
  db.prepare("INSERT OR IGNORE INTO study_host VALUES (1,?)").run(
    "urn:uuid:" + randomUUID(),
  );
  const host = db.prepare("SELECT host FROM study_host WHERE id=1").get() as {
    host: string;
  };
  const p = (s.pending = {
    state: secret(),
    nonce: secret(),
    verifier: secret(),
    redirect: origin + "/auth/callback",
    until: Date.now() + 600_000,
  });
  const query = new URLSearchParams({
    client_id: s.client ?? "dynamic_agent_client",
    response_type: "code",
    redirect_uri: p.redirect,
    resource,
    scope: scopes,
    state: p.state,
    nonce: p.nonce,
    ext_agent_host_id: host.host,
    code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(p.verifier).digest("base64url"),
  });
  if (!s.client) query.set("agent_name_hint", "ScholarSAT");
  return issuer + "/api/accounts/authorize?" + query;
}
export async function finishConnection(params: URLSearchParams) {
  const s = await session();
  const p = s?.pending;
  if (!s || !p || p.until < Date.now() || params.get("state") !== p.state)
    return false;
  delete s.pending;
  const client = params.get("client_id") ?? s.client;
  const code = params.get("code");
  if (
    params.has("error") ||
    !code ||
    !client ||
    client === "dynamic_agent_client" ||
    (s.client && s.client !== client)
  )
    return false;
  const res = await fetch(issuer + "/api/accounts/oauth/token", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    body: new URLSearchParams({
      grant_type: "authorization_code",
      resource,
      client_id: client,
      code,
      code_verifier: p.verifier,
      redirect_uri: p.redirect,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  const { payload } = await jwtVerify(data.id_token, keys, {
    issuer,
    audience: client,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "sub", "nonce"],
  });
  const granted = String(data.scope).split(" ");
  if (
    !payload.sub ||
    (s.subject && s.subject !== payload.sub) ||
    payload.nonce !== p.nonce ||
    !granted.includes("chatgpt.tokens.use.direct") ||
    !granted.includes("resource.invoke") ||
    typeof data.access_token !== "string" ||
    !(Number(data.expires_in) > 0)
  )
    return false;
  Object.assign(s, {
    client,
    subject: payload.sub,
    token: data.access_token,
    expires: Date.now() + Number(data.expires_in) * 1000,
  });
  return true;
}
export async function planToken() {
  const s = await session();
  return s && (s.expires ?? 0) > Date.now() ? s.token : undefined;
}
export async function disconnect() {
  const jar = await cookies();
  const id = jar.get(cookie)?.value;
  if (id) sessions.delete(id);
  jar.delete(cookie);
}
