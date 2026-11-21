"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui";
import { IKey } from "./icons";
import { useAiConfig } from "@/lib/use-ai-config";
import {
  AiError,
  PROVIDERS,
  clearAiConfig,
  isProvider,
  listModels,
  saveAiConfig,
  testConnection,
  type AiConfig,
  type ProviderId,
} from "@/lib/ai";

const inputCls =
  "w-full rounded-xl border border-line-strong bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-all focus:border-red focus:ring-3 focus:ring-red/15";

type Status = { kind: "idle" | "busy" | "ok" | "err"; msg: string };

/** Provider, key and model for the optional AI helpers. The key never leaves this browser except to go to the provider. */
export function AiKeyForm({ onSaved }: { onSaved?: () => void }) {
  const saved = useAiConfig();
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [keyInput, setKeyInput] = useState("");
  const [model, setModel] = useState(PROVIDERS.openai.defaultModel);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle", msg: "" });
  const [loaded, setLoaded] = useState(false);

  // Once the browser's saved settings are known, show them.
  useEffect(() => {
    if (saved === undefined || loaded) return;
    setLoaded(true);
    if (saved) {
      setProvider(saved.provider);
      setModel(saved.model);
    }
  }, [saved, loaded]);

  const savedForProvider = saved && saved.provider === provider ? saved : null;
  const effectiveKey = keyInput.trim() || savedForProvider?.apiKey || "";
  const current = (): AiConfig => ({ provider, apiKey: effectiveKey, model: model.trim() || PROVIDERS[provider].defaultModel });
  const busy = status.kind === "busy";

  const changeProvider = (p: ProviderId) => {
    setProvider(p);
    setModel(saved && saved.provider === p ? saved.model : PROVIDERS[p].defaultModel);
    setModels([]);
    setStatus({ kind: "idle", msg: "" });
  };

  const fail = (e: unknown) => setStatus({ kind: "err", msg: e instanceof AiError ? e.message : "Something went wrong." });

  const save = () => {
    if (!effectiveKey) return setStatus({ kind: "err", msg: "Paste your API key first." });
    if (/\s/.test(effectiveKey)) return setStatus({ kind: "err", msg: "That key has spaces in it. Copy it again without extra characters." });
    if (!saveAiConfig(current())) return setStatus({ kind: "err", msg: "Your browser would not let us save it (private mode or blocked storage)." });
    setKeyInput("");
    setStatus({ kind: "ok", msg: "Saved in this browser." });
    onSaved?.();
  };

  const test = async () => {
    if (!effectiveKey) return setStatus({ kind: "err", msg: "Paste your API key first." });
    setStatus({ kind: "busy", msg: "Testing…" });
    try {
      await testConnection(current());
      setStatus({ kind: "ok", msg: `Works. ${PROVIDERS[provider].label} answered.` });
    } catch (e) {
      fail(e);
    }
  };

  const load = async () => {
    if (!effectiveKey) return setStatus({ kind: "err", msg: "Paste your API key first." });
    setStatus({ kind: "busy", msg: "Loading models…" });
    try {
      const list = await listModels(current());
      setModels(list);
      setStatus(list.length ? { kind: "ok", msg: `${list.length} models available. Pick one from the model box.` } : { kind: "err", msg: "That key has no chat models available." });
    } catch (e) {
      fail(e);
    }
  };

  const remove = () => {
    clearAiConfig();
    setKeyInput("");
    setStatus({ kind: "ok", msg: "Key removed from this browser." });
  };

  const p = PROVIDERS[provider];
  const odd = keyInput.trim() && !keyInput.trim().startsWith(p.keyPrefix);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Provider
        <select
          value={provider}
          onChange={(e) => {
            if (isProvider(e.target.value)) changeProvider(e.target.value);
          }}
          className={inputCls}
        >
          {(Object.keys(PROVIDERS) as ProviderId[]).map((id) => (
            <option key={id} value={id}>
              {PROVIDERS[id].label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-ink">
        API key
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={savedForProvider ? `Saved key ending ${savedForProvider.apiKey.slice(-4)}` : p.keyPrefix + "…"}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={inputCls}
        />
        <span className="text-xs font-normal text-muted">
          Get one at{" "}
          <a href={p.keyUrl} target="_blank" rel="noreferrer" className="text-red hover:underline">
            {new URL(p.keyUrl).host}
          </a>
          .{odd ? ` Keys from ${p.label} usually start with ${p.keyPrefix}.` : ""}
        </span>
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Model
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          list="ai-models"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={inputCls}
        />
        <datalist id="ai-models">
          {models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <span className="text-xs font-normal text-muted">Model names change often. Use Load models to see what your key can use.</span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={test} disabled={busy}>
          Test
        </Button>
        <Button type="button" variant="secondary" onClick={load} disabled={busy}>
          Load models
        </Button>
        {saved && (
          <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
            Remove key
          </Button>
        )}
      </div>

      <p
        role="status"
        className={`min-h-5 text-sm ${status.kind === "err" ? "text-bad" : status.kind === "ok" ? "text-ok" : "text-muted"}`}
      >
        {status.msg}
      </p>
      <p className="text-xs text-muted">
        Your key is stored only in this browser and is sent only to {p.label}. ScholarSAT&apos;s servers never see it. You pay{" "}
        {p.label} directly for what you use, and clearing your browser data removes the key.
      </p>
    </form>
  );
}

/** Settings page card. */
export function AiSettings() {
  return (
    <section
      id="ai"
      className="grid scroll-mt-24 gap-6 rounded-2xl border border-line bg-bg p-6 shadow-card transition-colors md:grid-cols-[260px_1fr]"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-muted">
            <IKey className="h-5 w-5" />
          </span>
          <h2 className="text-[17px] font-medium text-ink">Bring your own AI</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Optional. Add your own API key to get AI explanations on practice questions and memory tricks for vocabulary. ScholarSAT works fully without it.
        </p>
      </div>
      <AiKeyForm />
    </section>
  );
}
