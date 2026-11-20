import { finishConnection, localOrigin } from "@/lib/study-connect";
export async function GET(req: Request) {
  const ok =
    !!localOrigin() &&
    (await finishConnection(new URL(req.url).searchParams).catch(() => false));
  return new Response(
    ok
      ? "ChatGPT is connected. Close this tab and return to your ScholarSAT exercise."
      : "ChatGPT connection was not completed. Return to your exercise and start sign-in again.",
    {
      status: ok ? 200 : 400,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    },
  );
}
