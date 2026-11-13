import { getUser } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { createTest } from "@/lib/tests";

export async function POST() {
  const user = await getUser();
  if (!user) return bad("Log in to take a practice test", 401);
  return json({ id: createTest(user.id) });
}
