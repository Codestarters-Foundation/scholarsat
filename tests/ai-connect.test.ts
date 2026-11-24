import assert from "node:assert/strict";
import test from "node:test";
import { AiError, PROVIDERS, PROVIDER_ORDER, buildRequest, cleanKey, connectAi, detectProvider, listModels, pickModel, repairModel, streamChat, type AiConfig } from "../src/lib/ai";

const KEY = "gsk_secretsecret123";
const gcfg = (model = "llama-3.3-70b-versatile"): AiConfig => ({ provider: "groq", apiKey: KEY, model });
const sseBody = (events: string[]) => events.map((e) => `${e}\n\n`).join("");
const streamRes = (events: string[], status = 200) => new Response(sseBody(events), { status, headers: { "content-type": "text/event-stream" } });
const GROQ_OK = ['data: {"choices":[{"delta":{"content":"Hel"}}]}', 'data: {"choices":[{"delta":{"content":"lo"}}]}', "data: [DONE]"];
const OPENAI_OK = ['data: {"type":"response.output_text.delta","delta":"ok"}'];

/** A tiny fake of a provider: /models answers `models`, anything else streams `events`. Records every call. */
function fakeProvider(o: { models?: unknown; modelsStatus?: number; modelsThrows?: boolean; events?: string[]; chatStatus?: number; chatBody?: unknown }) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (/\/models/.test(u)) {
      if (o.modelsThrows) throw new TypeError("Failed to fetch");
      return new Response(JSON.stringify(o.models ?? { data: [] }), { status: o.modelsStatus ?? 200 });
    }
    if (o.chatStatus && o.chatStatus !== 200) return new Response(JSON.stringify(o.chatBody ?? {}), { status: o.chatStatus });
    return streamRes(o.events ?? GROQ_OK);
  }) as typeof fetch;
  return { f, calls };
}

test("groq: request goes to the OpenAI-compatible endpoint with the system prompt first", () => {
  const { url, init } = buildRequest(gcfg(), "be nice", [{ role: "user", content: "hi" }]);
  assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal((init.headers as Record<string, string>).authorization, `Bearer ${KEY}`);
  const body = JSON.parse(String(init.body));
  assert.equal(body.model, "llama-3.3-70b-versatile");
  assert.equal(body.stream, true);
  assert.deepEqual(body.messages, [{ role: "system", content: "be nice" }, { role: "user", content: "hi" }]);
});

test("groq: streams text and ignores [DONE]", async () => {
  let out = "";
  await streamChat(gcfg(), { system: "s", messages: [{ role: "user", content: "x" }], onText: (d) => (out += d), fetchImpl: fakeProvider({}).f });
  assert.equal(out, "Hello");
});

test("groq: an empty stream, an in-stream error and a retired model are all explained", async () => {
  const run = (f: typeof fetch) => streamChat(gcfg(), { system: "s", messages: [], onText: () => {}, fetchImpl: f });
  await assert.rejects(run(fakeProvider({ events: ['data: {"choices":[{"delta":{}}]}'] }).f), (e: unknown) => e instanceof AiError && /no text/i.test(e.message));
  await assert.rejects(run(fakeProvider({ events: ['data: {"error":{"message":"overloaded"}}'] }).f), (e: unknown) => e instanceof AiError && /overloaded/.test(e.message));
  await assert.rejects(run(fakeProvider({ chatStatus: 400, chatBody: { error: { message: "The model `x` has been decommissioned and is no longer supported." } } }).f), (e: unknown) => e instanceof AiError && e.kind === "model");
  await assert.rejects(run(fakeProvider({ chatStatus: 401, chatBody: { error: { message: "Invalid API Key" } } }).f), (e: unknown) => e instanceof AiError && e.kind === "auth" && !e.message.includes(KEY));
  await assert.rejects(run(fakeProvider({ chatStatus: 429, chatBody: { error: { message: "Rate limit reached" } } }).f), (e: unknown) => e instanceof AiError && e.kind === "rate");
});

test("groq: model list drops speech, safety and system models and sorts", async () => {
  const ids = await listModels(gcfg(), fakeProvider({ models: { data: [{ id: "whisper-large-v3" }, { id: "openai/gpt-oss-20b" }, { id: "llama-guard-4-12b" }, { id: "groq/compound" }, { id: "llama-3.3-70b-versatile" }, { id: "playai-tts" }] } }).f);
  assert.deepEqual(ids, ["llama-3.3-70b-versatile", "openai/gpt-oss-20b"]);
});

test("every provider has plain-language setup steps and a link, and free ones come first", () => {
  assert.deepEqual([...PROVIDER_ORDER].sort(), Object.keys(PROVIDERS).sort());
  for (const id of PROVIDER_ORDER) {
    const p = PROVIDERS[id];
    assert.ok(p.steps.length >= 3 && p.keyUrl.startsWith("https://") && p.keyPrefix && p.tagline && p.keyUrlLabel, id);
    assert.ok(p.steps.every((s) => !/model/i.test(s)), `${id}: steps should never mention models`);
  }
  assert.deepEqual(PROVIDER_ORDER.map((id) => PROVIDERS[id].free), [true, true, false, false]);
  assert.equal(PROVIDER_ORDER[0], "gemini");
});

test("pickModel chooses for the student, newest first, and never needs a model name", () => {
  assert.equal(pickModel("groq", ["openai/gpt-oss-20b", "llama-3.1-8b-instant", "llama-3.3-70b-versatile"]), "llama-3.3-70b-versatile");
  assert.equal(pickModel("groq", ["openai/gpt-oss-20b", "llama-3.1-8b-instant"]), "openai/gpt-oss-20b");
  assert.equal(pickModel("gemini", ["gemini-2.5-flash", "gemini-3.10-flash", "gemini-3.8-flash", "gemini-3.8-pro", "gemini-3.8-flash-lite"]), "gemini-3.10-flash");
  assert.equal(pickModel("gemini", ["gemini-3.8-pro", "gemini-3.8-flash-lite"]), "gemini-3.8-flash-lite");
  assert.equal(pickModel("openai", ["gpt-5.4", "gpt-5.4-mini", "gpt-4.1-mini", "gpt-5.4-nano"]), "gpt-5.4-mini");
  assert.equal(pickModel("anthropic", ["claude-sonnet-5-5", "claude-haiku-4-5-20251001", "claude-haiku-5-5"]), "claude-haiku-5-5");
  assert.equal(pickModel("openai", ["o9-weird"]), "o9-weird"); // nothing we know: first available
  assert.equal(pickModel("groq", []), null);
});

test("detectProvider and cleanKey", () => {
  assert.equal(detectProvider("gsk_abc"), "groq");
  assert.equal(detectProvider("sk-ant-abc"), "anthropic");
  assert.equal(detectProvider("sk-proj-abc"), "openai");
  assert.equal(detectProvider("AIzaSyX"), "gemini");
  assert.equal(detectProvider("hello"), null);
  assert.equal(cleanKey('  "gsk_ab\n cd"  \n'), "gsk_abcd");
});

test("connectAi: checks the key, picks a model, proves it works", async () => {
  const p = fakeProvider({ models: { data: [{ id: "openai/gpt-oss-20b" }, { id: "llama-3.3-70b-versatile" }] } });
  const r = await connectAi("groq", `  ${KEY}\n`, { fetchImpl: p.f });
  assert.deepEqual(r.cfg, { provider: "groq", apiKey: KEY, model: "llama-3.3-70b-versatile" });
  assert.equal(r.auto, true);
  assert.equal(p.calls.length, 2); // list, then one test message
  assert.equal(JSON.parse(String(p.calls[1].init?.body)).model, "llama-3.3-70b-versatile");
});

test("connectAi: a key for the wrong service is caught before any request", async () => {
  const p = fakeProvider({});
  await assert.rejects(connectAi("groq", "sk-ant-api03-xyz", { fetchImpl: p.f }), (e: unknown) => e instanceof AiError && /Anthropic/.test(e.message) && !e.message.includes("api03"));
  await assert.rejects(connectAi("groq", "   ", { fetchImpl: p.f }), (e: unknown) => e instanceof AiError && /Paste your key/.test(e.message));
  assert.equal(p.calls.length, 0);
});

test("connectAi: a rejected key stops right there with a clear message", async () => {
  const p = fakeProvider({ modelsStatus: 401, models: { error: { message: "Invalid API Key" } } });
  await assert.rejects(connectAi("groq", KEY, { fetchImpl: p.f }), (e: unknown) => e instanceof AiError && e.kind === "auth" && !e.message.includes(KEY));
  assert.equal(p.calls.length, 1);
});

test("connectAi: if the model list can't be fetched it still works with the fallback model", async () => {
  const p = fakeProvider({ modelsThrows: true });
  const r = await connectAi("groq", KEY, { fetchImpl: p.f });
  assert.equal(r.cfg.model, PROVIDERS.groq.defaultModel);
  assert.deepEqual(r.models, []);
});

test("connectAi: an advanced override is used as given, and a bad one fails the test", async () => {
  const p = fakeProvider({ models: { data: [{ id: "llama-3.3-70b-versatile" }] } });
  const r = await connectAi("groq", KEY, { model: " openai/gpt-oss-20b ", fetchImpl: p.f });
  assert.equal(r.cfg.model, "openai/gpt-oss-20b");
  assert.equal(r.auto, false);
  const bad = fakeProvider({ chatStatus: 404, chatBody: { error: { message: "model does not exist" } } });
  await assert.rejects(connectAi("groq", KEY, { model: "nope", fetchImpl: bad.f }), (e: unknown) => e instanceof AiError && e.kind === "model");
});

test("connectAi works for the other providers too", async () => {
  const p = fakeProvider({ models: { data: [{ id: "gpt-5.4-mini" }, { id: "gpt-5.4" }] }, events: OPENAI_OK });
  const r = await connectAi("openai", "sk-proj-abc123", { fetchImpl: p.f });
  assert.equal(r.cfg.model, "gpt-5.4-mini");
});

test("repairModel swaps a retired model for a working one, or says there is none", async () => {
  const stale = gcfg("llama-old");
  const r = await repairModel(stale, fakeProvider({ models: { data: [{ id: "llama-old" }, { id: "llama-3.3-70b-versatile" }] } }).f);
  assert.equal(r?.model, "llama-3.3-70b-versatile");
  assert.equal(r?.apiKey, KEY);
  assert.equal(await repairModel(stale, fakeProvider({ models: { data: [{ id: "llama-old" }] } }).f), null);
  assert.equal(await repairModel(stale, fakeProvider({ modelsThrows: true }).f), null);
});

test("connectAi: if Groq is unreachable from the browser, the message points to the other free option", async () => {
  const dead = (async () => { throw new TypeError("Failed to fetch"); }) as typeof fetch;
  await assert.rejects(connectAi("groq", KEY, { fetchImpl: dead }), (e: unknown) => e instanceof AiError && /Gemini/.test(e.message) && e.kind === "network" && !e.message.includes(KEY));
  // other providers keep the ordinary message
  await assert.rejects(connectAi("openai", "sk-proj-abc", { fetchImpl: dead }), (e: unknown) => e instanceof AiError && !/Gemini/.test(e.message));
});
