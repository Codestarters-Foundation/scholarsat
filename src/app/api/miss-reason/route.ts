import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/http";
import { isMissReason } from "@/lib/miss-reasons";
import { saveMissReason } from "@/lib/miss-store";

/** Body: { id: questionId, reason: "misread" | "careless" | "rushed" | "dont_know" | null } */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const reason = body.reason === null ? null : body.reason;
  if (!id || id.length > 40) return bad("Unknown question");
  if (reason !== null && !isMissReason(reason)) return bad("Unknown reason");
  const user = await getUser();
  if (!user) return bad("Sign in to save this", 401);
  const result = saveMissReason(db, user.id, id, reason);
  if (result === "no-attempt") return bad("No recent wrong answer to attach this to", 404);
  return json({ ok: true, result });
}
