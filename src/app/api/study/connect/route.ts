import {
  localOrigin,
  startConnection,
  planToken,
  disconnect,
} from "@/lib/study-connect";
import { bad, json, rateLimit, clientIp } from "@/lib/http";
export async function GET() {
  return json({ origin: localOrigin(), connected: !!(await planToken()) });
}
export async function POST(req: Request) {
  const origin = localOrigin();
  if (!origin || req.headers.get("origin") !== origin)
    return bad("Open the loopback preview to connect ChatGPT.", 403);
  if (!rateLimit("study-auth:" + clientIp(req), 20, 600_000))
    return bad("Wait before starting another sign-in.", 429);
  return Response.redirect(await startConnection(origin), 303);
}
export async function DELETE(req: Request) {
  if (req.headers.get("origin") !== localOrigin() || !localOrigin())
    return bad("Invalid origin.", 403);
  await disconnect();
  return json({ ok: true });
}
