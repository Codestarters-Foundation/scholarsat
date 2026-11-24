import { getUser } from "@/lib/auth";
import { bad, json, rateLimit } from "@/lib/http";
import { castVote } from "@/lib/daily";
import { getDailyReveal } from "@/lib/daily-answer";
import type { Section } from "@/lib/types";

const isSection = (s: unknown): s is Section => s === "math" || s === "rw";

/** Submit an answer to today's daily question from the Diagnostics page. One vote per person per day
 *  (the first pick stays); the correct answer and explanation come back only after you've voted. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Not logged in", 401);
  if (!rateLimit(`daily-answer:${user.id}`, 60, 60_000)) return bad("Slow down a little.", 429);
  const b = (await req.json().catch(() => ({}))) as { section?: unknown; choice?: unknown };
  if (!isSection(b.section)) return bad("Bad section");
  if (typeof b.choice !== "string" || !["A", "B", "C", "D"].includes(b.choice)) return bad("Bad choice");
  const poll = castVote(b.section, user.id, b.choice);
  return json({ poll, reveal: getDailyReveal(b.section, user.id) });
}
