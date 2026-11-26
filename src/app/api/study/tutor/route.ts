import { followUpRequest, lessonRequest, TUTOR_DRAW_SYSTEM } from "@/lib/tutor-lesson";
import { BY_ID, isCorrect, toPublic } from "@/lib/bank";
import { lessons } from "@/data/context-lessons";
import { bad, json, rateLimit, clientIp } from "@/lib/http";
import { planToken, resource } from "@/lib/study-connect";

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (
    !URL.canParse(origin) ||
    new URL(origin).host !== req.headers.get("host") ||
    !req.headers.get("content-type")?.startsWith("application/json")
  )
    return bad("Use the tutor from ScholarSAT.", 403);
  if (!rateLimit("study:" + clientIp(req), 30, 600_000))
    return bad("Take a break and try again in a few minutes.", 429);
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.item !== "string" ||
    !["key", "plan"].includes(body.mode)
  )
    return bad("Choose a passage and an AI connection.");
  const q = BY_ID.get(body.item);
  const lesson = lessons.find((l) => "word:" + l.word === body.item);
  if (!lesson && !q) return bad("Exercise unavailable.", 404);
  const annotated = body.task === "lesson";
  if (annotated && (!q || typeof body.response !== "string" || body.response.length > 20 ||
      (body.followup !== undefined && (typeof body.followup !== "string" || body.followup.length > 500)) ||
      (body.previous !== undefined && (typeof body.previous !== "string" || body.previous.length > 8000))))
    return bad("Choose a completed exercise and a shorter follow-up.");
  const hint = body.task === "hint" && !!q;
  const instruction = hint
    ? "Give one short hint for the first step. Do not solve the problem, name an answer choice, or give the final value or word. Address the student directly in plain text."
    : "Explain this SAT exercise in under 90 words. Use the supplied answer and explanation. Show the decisive step in plain text.";
  const prompt = annotated && q ? TUTOR_DRAW_SYSTEM + "\n\n" + lessonRequest(q, body.response, q.answer, q.explanation, isCorrect(q, body.response)) +
    (body.followup ? "\nPrior lesson shown to the student: "+JSON.stringify(body.previous ?? "")+"\n\n" + followUpRequest(body.followup) : "") : instruction + " Use ordinary text: write x and 2x, without Markdown, dollar signs, or LaTeX.\n" + JSON.stringify(hint && q ? toPublic(q) : lesson ?? q);

  const key = body.mode === "key" ? body.key : await planToken();
  if (
    typeof key !== "string" ||
    !key.trim() ||
    (body.mode === "key" && key.length > 2048)
  )
    return bad("Connect your account or enter an API key.", 401);
  try {
    let model = "gpt-4.1-mini";
    if (body.mode === "plan") {
      const catalog = await fetch(resource + "/models", {
        cache: "no-store",
        headers: { Authorization: "Bearer " + key },
        signal: AbortSignal.timeout(10000),
      });
      if (!catalog.ok)
        return bad(
          "Could not access your ChatGPT models. Reconnect your plan and try again.",
          401,
        );
      const data = await catalog.json();
      const available = (data.models ?? []).filter(
        (m: { visibility: string; slug: string }) =>
          m.visibility === "list" && typeof m.slug === "string",
      );
      model =
        available.find((m: { slug: string }) => m.slug.endsWith("-sol"))
          ?.slug ?? available[0]?.slug;
      if (!model) return bad("This plan has no available tutor model.", 403);
    }
    const result = await fetch(resource + "/responses", {
      method: "POST",
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(45000)]),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key.trim(),
      },
      body: JSON.stringify({
        model,
        store: false,
        stream: true,
        input: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
    if (!result.ok)
      return bad(
        result.status === 429
          ? "Your provider limit was reached."
          : "OpenAI declined this request. Check your connection and model access.",
        result.status === 429 ? 429 : 400,
      );
    const stream = await result.text();
    for (const line of stream.split(/\r?\n/)) {
      if (!line.startsWith("data: {")) continue;
      const event = JSON.parse(line.slice(6));
      if (event.type === "response.completed") {
        const explanation = (event.response?.output ?? [])
          .flatMap(
            (o: { content?: { type: string; text?: string }[] }) =>
              o.content ?? [],
          )
          .filter((c: { type: string }) => c.type === "output_text")
          .map((c: { text: string }) => c.text)
          .join("\n");
        if (explanation) return json({ explanation });
      }
    }
    return bad(
      "OpenAI did not complete the explanation. Check your available usage.",
      502,
    );
  } catch {
    return bad("The provider could not finish this request. Try again.", 502);
  }
}
