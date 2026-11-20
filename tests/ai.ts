import assert from "node:assert/strict";
import test from "node:test";
import { AiError, buildRequest, listModels, parseAiConfig, parseChunk, streamChat, testConnection, type AiConfig } from "../src/lib/ai";
import { explainQuestionPrompt, memoryTrickPrompt } from "../src/lib/ai-prompts";

const KEY = "sk-secret-123456";
const cfg = (provider: AiConfig["provider"], model = "m1"): AiConfig => ({ provider, apiKey: KEY, model });

/** A fetch that answers with a server-sent-event body, delivered in awkward chunks to exercise buffering. */
function sse(events: string[], opts: { chunk?: number; status?: number; crlf?: boolean } = {}): typeof fetch {
  const nl = opts.crlf ? "\r\n" : "\n";
  const body = events.map((e) => `${e}${nl}${nl}`).join("");
  return (async () => {
    const enc = new TextEncoder().encode(body);
    const size = opts.chunk ?? enc.length;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < enc.length; i += size) c.enqueue(enc.slice(i, i + size));
        c.close();
      },
    });
    return new Response(stream, { status: opts.status ?? 200, headers: { "content-type": "text/event-stream" } });
  }) as typeof fetch;
}
const jsonRes = (status: number, body: unknown): typeof fetch => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

async function collect(c: AiConfig, f: typeof fetch) {
  let out = "";
  await streamChat(c, { system: "sys", messages: [{ role: "user", content: "hi" }], onText: (d) => (out += d), fetchImpl: f });
  return out;
}

const openaiEvents = [
  'event: response.created\ndata: {"type":"response.created"}',
  'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hel"}',
  'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"lo"}',
  'event: response.completed\ndata: {"type":"response.completed"}',
];
const anthropicEvents = [
  'event: message_start\ndata: {"type":"message_start"}',
  'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hel"}}',
  'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"lo"}}',
  'event: message_stop\ndata: {"type":"message_stop"}',
];
const geminiEvents = [
  'data: {"candidates":[{"content":{"parts":[{"text":"Hel"}],"role":"model"}}]}',
  'data: {"candidates":[{"content":{"parts":[{"text":"lo"}],"role":"model"},"finishReason":"STOP"}]}',
];

test("requests are shaped the way each provider documents", () => {
  const msgs = [{ role: "user" as const, content: "hello" }];
  const o = buildRequest(cfg("openai", "gpt-x"), "SYS", msgs);
  assert.equal(o.url, "https://api.openai.com/v1/responses");
  assert.equal((o.init.headers as Record<string, string>).authorization, `Bearer ${KEY}`);
  assert.deepEqual(JSON.parse(o.init.body as string), { model: "gpt-x", instructions: "SYS", input: msgs, stream: true, store: false });

  const a = buildRequest(cfg("anthropic", "claude-x"), "SYS", msgs);
  assert.equal(a.url, "https://api.anthropic.com/v1/messages");
  const ah = a.init.headers as Record<string, string>;
  assert.equal(ah["x-api-key"], KEY);
  assert.equal(ah["anthropic-version"], "2023-06-01");
  assert.equal(ah["anthropic-dangerous-direct-browser-access"], "true");
  assert.deepEqual(JSON.parse(a.init.body as string), { model: "claude-x", max_tokens: 1024, system: "SYS", messages: msgs, stream: true });

  const g = buildRequest(cfg("gemini", "models/gemini-x"), "SYS", [...msgs, { role: "assistant", content: "yo" }]);
  assert.equal(g.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-x:streamGenerateContent?alt=sse");
  assert.equal((g.init.headers as Record<string, string>)["x-goog-api-key"], KEY);
  assert.deepEqual(JSON.parse(g.init.body as string), {
    systemInstruction: { parts: [{ text: "SYS" }] },
    contents: [
      { role: "user", parts: [{ text: "hello" }] },
      { role: "model", parts: [{ text: "yo" }] },
    ],
  });
  // the key is never put in a URL
  for (const r of [o, a, g]) assert.ok(!r.url.includes(KEY));
});

for (const [name, provider, events, empty] of [
  ["openai", "openai", openaiEvents, openaiEvents[0]],
  ["anthropic", "anthropic", anthropicEvents, anthropicEvents[0]],
  ["gemini", "gemini", geminiEvents, 'data: {"candidates":[{"content":{"parts":[]}}]}'],
] as const) {
  test(`${name}: streams text, whole body or in tiny chunks, LF or CRLF`, async () => {
    assert.equal(await collect(cfg(provider), sse(events)), "Hello");
    assert.equal(await collect(cfg(provider), sse(events, { chunk: 7 })), "Hello");
    assert.equal(await collect(cfg(provider), sse(events, { chunk: 1, crlf: true })), "Hello");
  });

  test(`${name}: a stream with no text is reported, not shown as success`, async () => {
    await assert.rejects(collect(cfg(provider), sse([empty])), (e: unknown) => e instanceof AiError && /no text/i.test(e.message));
  });
}

test("multi-byte characters split across chunks survive", async () => {
  const ev = ['data: {"candidates":[{"content":{"parts":[{"text":"café — élève 🦉"}]}}]}'];
  assert.equal(await collect(cfg("gemini"), sse(ev, { chunk: 3 })), "café — élève 🦉");
});

test("errors from the provider are explained and never contain the key", async () => {
  const auth = await collect(cfg("openai"), jsonRes(401, { error: { message: `Incorrect API key provided: ${KEY}` } })).catch((e) => e as AiError);
  assert.ok(auth instanceof AiError);
  assert.equal(auth.kind, "auth");
  assert.ok(!auth.message.includes(KEY));
  assert.match(auth.message, /rejected your key/);

  const gem = await collect(cfg("gemini"), jsonRes(400, { error: { message: "API key not valid. Please pass a valid API key." } })).catch((e) => e as AiError);
  assert.equal((gem as AiError).kind, "auth");

  const rate = await collect(cfg("anthropic"), jsonRes(429, { error: { message: "rate limited" } })).catch((e) => e as AiError);
  assert.equal((rate as AiError).kind, "rate");

  const model = await collect(cfg("openai", "nope"), jsonRes(404, { error: { message: "The model `nope` does not exist" } })).catch((e) => e as AiError);
  assert.equal((model as AiError).kind, "model");
  assert.match((model as AiError).message, /nope/);

  const odd = await collect(cfg("openai"), jsonRes(500, "not an object")).catch((e) => e as AiError);
  assert.equal((odd as AiError).kind, "other");
});

test("failures reported inside the stream are surfaced", async () => {
  const o = await collect(cfg("openai"), sse(['data: {"type":"response.failed","response":{"error":{"message":"quota exceeded"}}}'])).catch((e) => e as AiError);
  assert.match((o as AiError).message, /quota exceeded/);
  const a = await collect(cfg("anthropic"), sse(['data: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}'])).catch((e) => e as AiError);
  assert.match((a as AiError).message, /Overloaded/);
  const g = await collect(cfg("gemini"), sse(['data: {"promptFeedback":{"blockReason":"SAFETY"}}'])).catch((e) => e as AiError);
  assert.match((g as AiError).message, /SAFETY/);
});

test("a network failure becomes a friendly AiError and an abort is passed through", async () => {
  const down = (async () => {
    throw new TypeError("Failed to fetch");
  }) as typeof fetch;
  const e = await collect(cfg("openai"), down).catch((x) => x as AiError);
  assert.ok(e instanceof AiError);
  assert.equal(e.kind, "network");

  const aborted = (async () => {
    throw new DOMException("aborted", "AbortError");
  }) as typeof fetch;
  await assert.rejects(collect(cfg("openai"), aborted), (x: unknown) => x instanceof DOMException && x.name === "AbortError");
});

test("parseChunk ignores noise", () => {
  assert.equal(parseChunk("openai", "[DONE]"), "");
  assert.equal(parseChunk("openai", "not json"), "");
  assert.equal(parseChunk("openai", "42"), "");
  assert.equal(parseChunk("anthropic", '{"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"{}"}}'), "");
  assert.equal(parseChunk("gemini", '{"candidates":[]}'), "");
});

test("listModels filters to usable chat models and sorts", async () => {
  const openai = await listModels(cfg("openai"), jsonRes(200, { data: [{ id: "gpt-5.4-mini" }, { id: "text-embedding-3-small" }, { id: "gpt-4o-realtime-preview" }, { id: "o4-mini" }, { id: "whisper-1" }, { id: "gpt-5.4" }] }));
  assert.deepEqual(openai, ["gpt-5.4", "gpt-5.4-mini", "o4-mini"]);
  const anthropic = await listModels(cfg("anthropic"), jsonRes(200, { data: [{ id: "claude-sonnet-5-5" }, { id: "claude-haiku-5-5" }] }));
  assert.deepEqual(anthropic, ["claude-haiku-5-5", "claude-sonnet-5-5"]);
  const gemini = await listModels(
    cfg("gemini"),
    jsonRes(200, {
      models: [
        { name: "models/gemini-3.8-flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-embedding-001", supportedGenerationMethods: ["embedContent"] },
        { name: "models/gemini-3-pro-image", supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-bison", supportedGenerationMethods: ["generateContent"] },
      ],
    }),
  );
  assert.deepEqual(gemini, ["gemini-3.8-flash"]);
  await assert.rejects(listModels(cfg("openai"), jsonRes(401, { error: { message: "bad" } })), (e: unknown) => e instanceof AiError && e.kind === "auth");
});

test("testConnection passes on text and fails on a bad key", async () => {
  await testConnection(cfg("openai"), sse(openaiEvents));
  await assert.rejects(testConnection(cfg("openai"), jsonRes(401, {})), (e: unknown) => e instanceof AiError && e.kind === "auth");
});

test("saved settings are validated when read back", () => {
  assert.deepEqual(parseAiConfig(JSON.stringify(cfg("openai"))), cfg("openai"));
  assert.equal(parseAiConfig(null), null);
  assert.equal(parseAiConfig("{bad"), null);
  assert.equal(parseAiConfig(JSON.stringify({ provider: "evil", apiKey: "x", model: "y" })), null);
  assert.equal(parseAiConfig(JSON.stringify({ provider: "openai", apiKey: "", model: "y" })), null);
  assert.equal(parseAiConfig(JSON.stringify({ provider: "openai", apiKey: "k" })), null);
});

test("question prompt carries the passage, choices, the student's answer and the official explanation", () => {
  const p = explainQuestionPrompt(
    { section: "rw", skill: "Inferences", difficulty: "M", type: "mcq", stem: "Which choice best completes the text?", passage: "The moon is bright.", choices: ["one", "two", "three", "four"] },
    "B",
    "C",
    "Because three.",
    false,
  );
  for (const bit of ["Inferences", "The moon is bright.", "A. one", "D. four", "Correct answer: C", "answered: B (incorrect)", "Because three."]) assert.ok(p.includes(bit), bit);
  const spr = explainQuestionPrompt({ section: "math", skill: "Percentages", difficulty: "E", type: "spr", stem: "What is 10% of 50?", table: { headers: ["a", "b"], rows: [[1, 2]] } }, "5", "5", "0.1 * 50", true);
  assert.ok(spr.includes("a | b") && spr.includes("1 | 2") && spr.includes("(correct)") && !spr.includes("A. "));
  const m = memoryTrickPrompt({ word: "abate", pos: "verb", def: "to lessen", ex: "The storm abated." });
  assert.ok(m.includes("abate") && m.includes("to lessen"));
});
