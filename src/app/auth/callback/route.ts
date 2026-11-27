import { finishConnection, localOrigin } from "@/lib/study-connect";
export async function GET(req: Request) {
  const ok =
    !!localOrigin() &&
    (await finishConnection(new URL(req.url).searchParams).catch(() => false));
  const title = ok ? "Your ChatGPT plan is connected" : "Sign-in was not completed";
  const detail = ok ? "Return to your exercise tab to ask for a hint with your plan." : "Your exercise is still open. Return to it and choose Continue with ChatGPT to try again.";
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} · ScholarSAT</title><link rel="stylesheet" href="/study-result.css"></head>
    <body><main><p class="brand">ScholarSAT</p><div class="result"><span class="mark" aria-hidden="true">${ok ? "✓" : "↺"}</span>
    <h1>${title}</h1><p>${detail}</p><a href="/tutor?connection=plan#question-tutor">Open the AI tutor <span aria-hidden="true">→</span></a></div></main></body></html>`;
  return new Response(page, {status:ok ? 200 : 400,headers:{
    "content-type":"text/html; charset=utf-8", "cache-control":"no-store","referrer-policy":"no-referrer",
    "content-security-policy":"default-src 'none'; style-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  }});
}
