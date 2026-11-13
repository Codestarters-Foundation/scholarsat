import { getUser } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { castVote } from "@/lib/daily";
import type { Section } from "@/lib/types";

/** Records the viewer's vote on today's daily question and returns the poll results. Never reveals the answer. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Not logged in", 401);
  const b = (await req.json().catch(() => ({}))) as { section?: string; choice?: string };
  if (b.section !== "math" && b.section !== "rw") return bad("Bad section");
  if (!b.choice || !["A", "B", "C", "D"].includes(b.choice)) return bad("Bad choice");
  return json(castVote(b.section as Section, user.id, b.choice));
}
