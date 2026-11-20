/**
 * Bring-your-own-key AI. The key lives only in this browser (localStorage) and requests go straight
 * from the browser to the provider; the ScholarSAT server never sees the key or the conversation.
 *
 * No framework imports here, so it can be unit tested with a fake fetch.
 */

export type ProviderId = "openai" | "anthropic" | "gemini";
export type AiConfig = { provider: ProviderId; apiKey: string; model: string };
export type ChatMessage = { role: "user" | "assistant"; content: string };

export const PROVIDERS: Record<ProviderId, { label: string; defaultModel: string; keyUrl: string; keyPrefix: string }> = {
  openai: { label: "OpenAI", defaultModel: "gpt-5.4-mini", keyUrl: "https://platform.openai.com/api-keys", keyPrefix: "sk-" },
  anthropic: { label: "Anthropic (Claude)", defaultModel: "claude-haiku-5-5", keyUrl: "https://console.anthropic.com/settings/keys", keyPrefix: "sk-ant-" },
  gemini: { label: "Google Gemini", defaultModel: "gemini-3.8-flash", keyUrl: "https://aistudio.google.com/apikey", keyPrefix: "AIza" },
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
  if (status === 404 || (/model/i.test(detail) && /not found|does not exist|not supported|invalid/i.test(detail)))
    return new AiError(`${name} does not recognise the model "${cfg.model}". Pick another in Settings. ${detail}`.trim(), "model");
  return new AiError(`${name} returned an error (${status}). ${detail}`.trim(), "other");
}

// ----------------------------------------------------------------- requests

type Req = { url: string; init: RequestInit };

export function buildRequest(cfg: AiConfig, system: string, messages: ChatMessage[], signal?: AbortSignal): Req {
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
          body: JSON.stringify({ model: cfg.model, max_tokens: 1024, system, messages, stream: true }),
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
};

/** Streams a reply, calling `onText` with each piece. Throws AiError on any provider or network failure. */
export async function streamChat(cfg: AiConfig, opts: StreamOpts): Promise<void> {
  const doFetch = opts.fetchImpl ?? fetch;
  const { url, init } = buildRequest(cfg, opts.system, opts.messages, opts.signal);
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
  openai: "https://api.openai.com/v1/models",
  anthropic: "https://api.anthropic.com/v1/models?limit=100",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
};

/** Asks the provider which models this key can use, so the picker never goes stale. */
export async function listModels(cfg: AiConfig, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const headers: Record<string, string> =
    cfg.provider === "openai"
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
