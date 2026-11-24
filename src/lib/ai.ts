/**
 * Bring-your-own-key AI. The key lives only in this browser (localStorage) and requests go straight
 * from the browser to the provider; the ScholarSAT server never sees the key or the conversation.
 *
 * No framework imports here, so it can be unit tested with a fake fetch.
 */

export type ProviderId = "groq" | "gemini" | "openai" | "anthropic";
export type AiConfig = { provider: ProviderId; apiKey: string; model: string };
export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ProviderInfo = {
  label: string;
  /** one line, plain language, shown on the provider card */
  tagline: string;
  /** true = there is a no-cost plan, so a student can use this without paying */
  free: boolean;
  /** fallback only; the app normally picks the model itself (see pickModel) */
  defaultModel: string;
  keyUrl: string;
  keyUrlLabel: string;
  /** what the key starts with, shown as a hint and used to catch the wrong key in the wrong box */
  keyPrefix: string;
  /** numbered, plain-language steps for getting a key */
  steps: string[];
  note?: string;
};

/** Free options first. The first one is what the setup screen preselects. */
export const PROVIDER_ORDER: ProviderId[] = ["gemini", "groq", "openai", "anthropic"];

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  groq: {
    label: "Groq",
    tagline: "Free and very fast. The easiest way to start.",
    free: true,
    defaultModel: "llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
    keyUrlLabel: "Open Groq",
    keyPrefix: "gsk_",
    steps: [
      "Click “Open Groq” and sign up. The free plan is all you need.",
      "Open “API Keys”, then click “Create API Key”. Name it anything, like ScholarSAT.",
      "Copy the key (it starts with gsk_) and paste it below.",
    ],
    note: "Free plans have daily limits. If you hit one, just try again later.",
  },
  gemini: {
    label: "Google Gemini",
    tagline: "Free plan available. Works with any Google account.",
    free: true,
    defaultModel: "gemini-3.8-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "Open Google AI Studio",
    keyPrefix: "AIza",
    steps: [
      "Click “Open Google AI Studio” and sign in with a Google account.",
      "Click “Create API key”. If it asks for a project, pick any or let it make one.",
      "Copy the key (it usually starts with AIza) and paste it below.",
    ],
    note: "On Google's free plan, your questions may be used to improve their products. Don't type personal details.",
  },
  openai: {
    label: "OpenAI (ChatGPT)",
    tagline: "Paid. You pay a small amount for what you use.",
    free: false,
    defaultModel: "gpt-5.4-mini",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlLabel: "Open OpenAI",
    keyPrefix: "sk-",
    steps: [
      "Click “Open OpenAI”, sign in, and add a payment method. Set a small monthly limit first.",
      "Click “Create new secret key” and copy it right away. You can't see it again.",
      "Paste it below.",
    ],
    note: "A ChatGPT subscription does not include API use. This needs its own billing.",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    tagline: "Paid. You pay a small amount for what you use.",
    free: false,
    defaultModel: "claude-haiku-5-5",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "Open Anthropic",
    keyPrefix: "sk-ant-",
    steps: [
      "Click “Open Anthropic”, sign in, and add credits. A small amount goes a long way.",
      "Click “Create Key” and copy it right away.",
      "Paste it below.",
    ],
    note: "A Claude subscription does not include API use. This needs its own credits.",
  },
};

export const isProvider = (v: unknown): v is ProviderId => typeof v === "string" && v in PROVIDERS;

// ------------------------------------------------------------------- storage

export const AI_STORAGE_KEY = "ss_ai_config_v1";
export const AI_CHANGE_EVENT = "ss-ai-config";

export function parseAiConfig(raw: string | null | undefined): AiConfig | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<AiConfig> | null;
    if (v && isProvider(v.provider) && typeof v.apiKey === "string" && v.apiKey && typeof v.model === "string" && v.model) {
      return { provider: v.provider, apiKey: v.apiKey, model: v.model };
    }
  } catch {}
  return null;
}

export function readAiConfigRaw(): string | null {
  try {
    return window.localStorage.getItem(AI_STORAGE_KEY);
  } catch {
    return null;
  }
}

function notify() {
  try {
    window.dispatchEvent(new Event(AI_CHANGE_EVENT));
  } catch {}
}

/** Returns false if the browser refused to store it (private mode, storage blocked). */
export function saveAiConfig(cfg: AiConfig): boolean {
  try {
    window.localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(cfg));
    notify();
    return true;
  } catch {
    return false;
  }
}

export function clearAiConfig() {
  try {
    window.localStorage.removeItem(AI_STORAGE_KEY);
  } catch {}
  notify();
}

export function subscribeAiConfig(cb: () => void): () => void {
  window.addEventListener(AI_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb); // another tab changed it
  return () => {
    window.removeEventListener(AI_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// -------------------------------------------------------------------- errors

export type AiErrorKind = "auth" | "rate" | "model" | "network" | "other";

export class AiError extends Error {
  kind: AiErrorKind;
  constructor(message: string, kind: AiErrorKind = "other") {
    super(message);
    this.name = "AiError";
    this.kind = kind;
  }
}

const asObj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/** Pulls the human message out of an `{error: {message}}` body (all three providers use this shape). */
function errorMessage(v: unknown): string | undefined {
  const o = asObj(v);
  const e = o?.error;
  return str(asObj(e)?.message) ?? str(e) ?? str(o?.message);
}

/** Never let a key leak into an error message the UI might show or log. */
function scrub(msg: string, key: string): string {
  return key ? msg.split(key).join("[key]") : msg;
}

function httpError(cfg: AiConfig, status: number, body: unknown): AiError {
  const name = PROVIDERS[cfg.provider].label;
  const detail = scrub(errorMessage(body) ?? "", cfg.apiKey);
  if (status === 401 || status === 403 || /api key not valid|invalid api key|incorrect api key/i.test(detail))
    return new AiError(`${name} rejected your key. Check it and try again.`, "auth");
  if (status === 429) return new AiError(`${name} says you are out of quota or sending too fast. ${detail}`.trim(), "rate");
  if (status === 404 || (/model/i.test(detail) && /not found|does not exist|not supported|invalid|decommissioned|deprecated|no longer/i.test(detail)))
    return new AiError(`${name} no longer offers the model "${cfg.model}".`, "model");
  return new AiError(`${name} returned an error (${status}). ${detail}`.trim(), "other");
}

// ----------------------------------------------------------------- requests

type Req = { url: string; init: RequestInit };

/** Reply length cap. Only Groq and Anthropic need one sent; for Gemini and OpenAI it would also cut into the model's thinking. */
export const DEFAULT_MAX_TOKENS = 1024;

export function buildRequest(cfg: AiConfig, system: string, messages: ChatMessage[], signal?: AbortSignal, maxTokens: number = DEFAULT_MAX_TOKENS): Req {
  const json = { "content-type": "application/json" };
  switch (cfg.provider) {
    case "openai":
      return {
        url: "https://api.openai.com/v1/responses",
        init: {
          method: "POST",
          signal,
          headers: { ...json, authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({ model: cfg.model, instructions: system, input: messages, stream: true, store: false }),
        },
      };
    case "groq":
      return {
        url: "https://api.groq.com/openai/v1/chat/completions",
        init: {
          method: "POST",
          signal,
          headers: { ...json, authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({ model: cfg.model, messages: [{ role: "system", content: system }, ...messages], stream: true, max_completion_tokens: maxTokens }),
        },
      };
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/messages",
        init: {
          method: "POST",
          signal,
          headers: {
            ...json,
            "x-api-key": cfg.apiKey,
            "anthropic-version": "2023-06-01",
            // Required for calls made directly from a browser.
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages, stream: true }),
        },
      };
    case "gemini": {
      const model = cfg.model.replace(/^models\//, "");
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
        init: {
          method: "POST",
          signal,
          headers: { ...json, "x-goog-api-key": cfg.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          }),
        },
      };
    }
  }
}

/** Reads one streamed event. Returns the text it carries, or throws if the provider reported a failure. */
export function parseChunk(provider: ProviderId, data: string): string {
  let v: unknown;
  try {
    v = JSON.parse(data);
  } catch {
    return ""; // keep-alives and "[DONE]"
  }
  const o = asObj(v);
  if (!o) return "";
  if (provider === "openai") {
    if (o.type === "response.output_text.delta") return str(o.delta) ?? "";
    if (o.type === "response.failed") throw new AiError(errorMessage(asObj(o.response)) ?? "The model failed to answer.");
    if (o.type === "error") throw new AiError(errorMessage(o) ?? "The model returned an error.");
    return "";
  }
  if (provider === "groq") {
    if (o.error) throw new AiError(errorMessage(o) ?? "The model returned an error.");
    const choice = Array.isArray(o.choices) ? asObj(o.choices[0]) : null;
    return str(asObj(choice?.delta)?.content) ?? "";
  }
  if (provider === "anthropic") {
    if (o.type === "content_block_delta") {
      const d = asObj(o.delta);
      return d?.type === "text_delta" ? (str(d.text) ?? "") : "";
    }
    if (o.type === "error") throw new AiError(errorMessage(o) ?? "The model returned an error.");
    return "";
  }
  // gemini
  if (o.error) throw new AiError(errorMessage(o) ?? "The model returned an error.");
  const block = str(asObj(o.promptFeedback)?.blockReason);
  if (block) throw new AiError(`Gemini declined this prompt (${block}).`);
  const cand = Array.isArray(o.candidates) ? asObj(o.candidates[0]) : null;
  const parts = asObj(cand?.content)?.parts;
  return Array.isArray(parts) ? parts.map((p) => str(asObj(p)?.text) ?? "").join("") : "";
}

/** Splits a server-sent-events stream into `data:` payloads. */
async function readSse(res: Response, onData: (data: string) => void) {
  if (!res.body) throw new AiError("The provider sent no data.");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const flush = (block: string) => {
    const data = block
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).replace(/^ /, ""))
      .join("\n");
    if (data) onData(data);
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    for (;;) {
      const m = /\r?\n\r?\n/.exec(buf);
      if (!m) break;
      flush(buf.slice(0, m.index));
      buf = buf.slice(m.index + m[0].length);
    }
  }
  buf += dec.decode();
  if (buf.trim()) flush(buf);
}

export type StreamOpts = {
  system: string;
  messages: ChatMessage[];
  onText: (delta: string) => void;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  /** Longest reply to allow (default 1024). The drawing tutor asks for more because its replies are JSON. */
  maxTokens?: number;
};

/** Streams a reply, calling `onText` with each piece. Throws AiError on any provider or network failure. */
export async function streamChat(cfg: AiConfig, opts: StreamOpts): Promise<void> {
  const doFetch = opts.fetchImpl ?? fetch;
  const { url, init } = buildRequest(cfg, opts.system, opts.messages, opts.signal, opts.maxTokens);
  let res: Response;
  try {
    res = await doFetch(url, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new AiError(`Could not reach ${PROVIDERS[cfg.provider].label}. Check your connection, or whether an ad blocker is stopping the request.`, "network");
  }
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {}
    throw httpError(cfg, res.status, body);
  }
  let got = false;
  try {
    await readSse(res, (data) => {
      const t = parseChunk(cfg.provider, data);
      if (t) {
        got = true;
        opts.onText(t);
      }
    });
  } catch (e) {
    if (e instanceof AiError) throw new AiError(scrub(e.message, cfg.apiKey), e.kind);
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new AiError("The connection dropped while the answer was streaming.", "network");
  }
  if (!got) throw new AiError("The model returned no text. Try again, or pick a different model.");
}

// ------------------------------------------------------------- model listing

const LIST_URL: Record<ProviderId, string> = {
  groq: "https://api.groq.com/openai/v1/models",
  openai: "https://api.openai.com/v1/models",
  anthropic: "https://api.anthropic.com/v1/models?limit=100",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
};

/** Asks the provider which models this key can use, so the picker never goes stale. */
export async function listModels(cfg: AiConfig, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const headers: Record<string, string> =
    cfg.provider === "openai" || cfg.provider === "groq"
      ? { authorization: `Bearer ${cfg.apiKey}` }
      : cfg.provider === "anthropic"
        ? { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
        : { "x-goog-api-key": cfg.apiKey };
  let res: Response;
  try {
    res = await fetchImpl(LIST_URL[cfg.provider], { headers });
  } catch {
    throw new AiError(`Could not reach ${PROVIDERS[cfg.provider].label}.`, "network");
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {}
  if (!res.ok) throw httpError(cfg, res.status, body);
  const o = asObj(body);
  const list = Array.isArray(o?.data) ? o.data : Array.isArray(o?.models) ? o.models : [];
  const ids: string[] = [];
  for (const m of list) {
    const mo = asObj(m);
    if (!mo) continue;
    if (cfg.provider === "gemini") {
      const methods = Array.isArray(mo.supportedGenerationMethods) ? mo.supportedGenerationMethods : [];
      const id = (str(mo.name) ?? "").replace(/^models\//, "");
      if (methods.includes("generateContent") && /^gemini/.test(id) && !/embedding|image|tts|live|robotics|aqa/.test(id)) ids.push(id);
    } else if (cfg.provider === "groq") {
      const id = str(mo.id) ?? "";
      if (id && !/whisper|tts|playai|orpheus|guard|safeguard|embed|compound|distil/i.test(id)) ids.push(id);
    } else {
      const id = str(mo.id) ?? "";
      const chatModel = /^(gpt|o\d)/.test(id) && !/audio|realtime|image|tts|transcribe|search|embedding|moderation|whisper|instruct|codex/.test(id);
      if (cfg.provider === "anthropic" ? id.startsWith("claude") : chatModel) ids.push(id);
    }
  }
  return [...new Set(ids)].sort();
}

/** One tiny request to prove the key, provider and model all work. */
export async function testConnection(cfg: AiConfig, fetchImpl?: typeof fetch): Promise<void> {
  let text = "";
  await streamChat(cfg, {
    system: "Reply with the single word: ok",
    messages: [{ role: "user", content: "ping" }],
    onText: (d) => (text += d),
    fetchImpl,
  });
  if (!text.trim()) throw new AiError("The model replied with nothing.");
}

// ------------------------------------------------- automatic model choice + setup

const byNewest = (a: string, b: string) => b.localeCompare(a, "en", { numeric: true });

/** What we'd like to use, best first. Each entry is tried against the provider's own list. */
const PREFER: Record<ProviderId, RegExp[]> = {
  groq: [/^llama-3\.3-70b-versatile$/, /^llama-3\.3-70b/, /^openai\/gpt-oss-20b$/, /^llama-3\.1-8b-instant$/, /^openai\/gpt-oss-120b$/],
  gemini: [/^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-flash-lite$/, /flash/],
  openai: [/^gpt-[\d.]+-mini$/, /^gpt-[\d.]+-nano$/, /^gpt-4o-mini$/],
  anthropic: [/^claude-haiku-[\d-]+$/, /haiku/],
};

/**
 * Chooses a model so nobody has to know model names: the first preferred pattern that the provider's
 * list contains (newest version wins), else our fallback if it's listed, else the first model in the
 * list. Returns null when the list is empty.
 */
export function pickModel(provider: ProviderId, ids: string[]): string | null {
  for (const re of PREFER[provider]) {
    const hits = ids.filter((id) => re.test(id)).sort(byNewest);
    if (hits.length) return hits[0];
  }
  const fallback = PROVIDERS[provider].defaultModel;
  if (ids.includes(fallback)) return fallback;
  return ids[0] ?? null;
}

/** Which provider a key looks like it belongs to, from its distinctive start. Null if unsure. */
export function detectProvider(key: string): ProviderId | null {
  const k = key.trim();
  if (k.startsWith("gsk_")) return "groq";
  if (k.startsWith("sk-ant-")) return "anthropic";
  if (k.startsWith("AIza")) return "gemini";
  if (k.startsWith("sk-")) return "openai";
  return null;
}

/** Pasted keys often arrive with spaces, line breaks or quotes around them. */
export const cleanKey = (raw: string) => raw.replace(/\s+/g, "").replace(/^["'`]+|["'`]+$/g, "");

export type ConnectResult = { cfg: AiConfig; models: string[]; auto: boolean };

/**
 * The whole "Connect" button: clean the key, check it against the provider, pick a model for the
 * student (unless they chose one under Advanced), and prove it works with one tiny request.
 * Throws an AiError whose message is safe and plain enough to show as is.
 */
export async function connectAi(
  provider: ProviderId,
  rawKey: string,
  opts: { model?: string; fetchImpl?: typeof fetch } = {},
): Promise<ConnectResult> {
  const apiKey = cleanKey(rawKey);
  if (!apiKey) throw new AiError("Paste your key first.", "auth");
  const seen = detectProvider(apiKey);
  if (seen && seen !== provider)
    throw new AiError(`That looks like a ${PROVIDERS[seen].label} key. Choose ${PROVIDERS[seen].label} above, or paste a ${PROVIDERS[provider].label} key.`, "auth");

  const probe: AiConfig = { provider, apiKey, model: opts.model?.trim() || PROVIDERS[provider].defaultModel };
  let models: string[] = [];
  try {
    models = await listModels(probe, opts.fetchImpl);
  } catch (e) {
    if (e instanceof AiError && e.kind === "auth") throw e; // a bad key is the one failure we can be sure about
    // Anything else (network hiccup, odd list response): fall back to our default model and let the test decide.
  }
  const chosen = opts.model?.trim() || pickModel(provider, models) || PROVIDERS[provider].defaultModel;
  const cfg: AiConfig = { provider, apiKey, model: chosen };
  try {
    await testConnection(cfg, opts.fetchImpl);
  } catch (e) {
    // Groq's browser access is the one thing we could not confirm ahead of time. If nothing got through at
    // all, say so plainly and point at the other free option instead of blaming the student's connection.
    if (provider === "groq" && e instanceof AiError && e.kind === "network" && models.length === 0)
      throw new AiError("Groq didn't answer from this browser. If you're online, Groq may not allow this kind of connection. Try Google Gemini instead; it's free too.", "network");
    throw e;
  }
  return { cfg, models, auto: !opts.model?.trim() };
}

/**
 * Called when a saved model stops working (providers retire models). Looks up what is available now and
 * returns the config with a working model, or null if there is nothing better to switch to.
 */
export async function repairModel(cfg: AiConfig, fetchImpl?: typeof fetch): Promise<AiConfig | null> {
  let models: string[];
  try {
    models = await listModels(cfg, fetchImpl);
  } catch {
    return null;
  }
  const next = pickModel(cfg.provider, models.filter((m) => m !== cfg.model));
  return next ? { ...cfg, model: next } : null;
}
