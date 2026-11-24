"use client";
import { useId, useState } from "react";
import { Button } from "./ui";
import { ICheck } from "./icons";
import { useAiConfig } from "@/lib/use-ai-config";
import { AiError, PROVIDERS, PROVIDER_ORDER, clearAiConfig, connectAi, repairModel, saveAiConfig, testConnection, type AiConfig, type ProviderId } from "@/lib/ai";

const inputCls =
  "w-full rounded-xl border border-line-strong bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-all focus:border-red focus:ring-3 focus:ring-red/15";

type Status = { kind: "idle" | "busy" | "ok" | "err"; msg: string };

/**
 * Guided setup for the optional AI helpers: pick a service, follow three plain steps to get a key,
 * paste it, press Connect. Nobody has to know what a "model" is; the app picks one and checks it works.
 * The key stays in this browser and only goes to the service the student chose.
 */
export function AiConnect({ onConnected }: { onConnected?: (cfg: AiConfig) => void }) {
  const saved = useAiConfig();
  const uid = useId();
  const [provider, setProvider] = useState<ProviderId>(PROVIDER_ORDER[0]);
  const [keyInput, setKeyInput] = useState("");
  const [show, setShow] = useState(false);
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle", msg: "" });
  const [changing, setChanging] = useState(false);
  const busy = status.kind === "busy";
  const p = PROVIDERS[provider];

  if (saved === undefined) return null; // browser not read yet; keeps server and first client render identical

  const fail = (e: unknown) => setStatus({ kind: "err", msg: e instanceof AiError ? e.message : "Something went wrong. Please try again." });

  const connect = async () => {
    setStatus({ kind: "busy", msg: "Checking your key…" });
    try {
      const r = await connectAi(provider, keyInput, { model });
      if (!saveAiConfig(r.cfg)) {
        setStatus({ kind: "err", msg: "Your browser wouldn't let us save it (private window or blocked storage). Try a normal window." });
        return;
      }
      setModels(r.models);
      setKeyInput("");
      setChanging(false);
      setStatus({ kind: "ok", msg: `Connected to ${PROVIDERS[provider].label}. You're all set.` });
      onConnected?.(r.cfg);
    } catch (e) {
      fail(e);
    }
  };

  const test = async () => {
    if (!saved) return;
    setStatus({ kind: "busy", msg: "Sending a test…" });
    try {
      try {
        await testConnection(saved);
      } catch (e) {
        if (!(e instanceof AiError) || e.kind !== "model") throw e;
        const fixed = await repairModel(saved);
        if (!fixed) throw e;
        await testConnection(fixed);
        saveAiConfig(fixed);
      }
      setStatus({ kind: "ok", msg: "It works." });
    } catch (e) {
      fail(e);
    }
  };

  // ------------------------------------------------------------ already connected
  if (saved && !changing) {
    return (
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-ok/30 bg-ok-50 p-4">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok text-white"><ICheck className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-ink">Connected to {PROVIDERS[saved.provider].label}</p>
            <p className="mt-0.5 text-sm text-ink-2">AI help is on. You&apos;ll see an AI button after practice questions and in vocabulary.</p>
            <p className="mt-1 text-xs text-muted">Using {saved.model}, chosen automatically.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={test} disabled={busy}>Send a test</Button>
          <Button type="button" variant="ghost" onClick={() => { setChanging(true); setProvider(saved.provider); setStatus({ kind: "idle", msg: "" }); }} disabled={busy}>Change service or key</Button>
          <Button type="button" variant="ghost" onClick={() => { clearAiConfig(); setStatus({ kind: "idle", msg: "" }); }} disabled={busy}>Disconnect</Button>
        </div>
        <p role="status" className={`min-h-5 text-sm ${status.kind === "err" ? "text-bad" : status.kind === "ok" ? "text-ok" : "text-muted"}`}>{status.msg}</p>
      </div>
    );
  }

  // ------------------------------------------------------------------ setup flow
  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void connect();
      }}
      // Enter belongs to this form; don't let a surrounding screen treat it as "Continue".
      onKeyDown={(e) => {
        if (e.key === "Enter") e.stopPropagation();
      }}
    >
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-ink">1. Pick a service</legend>
        <p className="text-xs text-muted">Don&apos;t want to pay? Pick Groq or Google Gemini. Both have free plans.</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PROVIDER_ORDER.map((id) => {
            const info = PROVIDERS[id];
            return (
              <label
                key={id}
                className="relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-line bg-bg p-3.5 transition-colors hover:border-red-200 has-[:checked]:border-red has-[:checked]:bg-red-50 focus-within:ring-2 focus-within:ring-red/30"
              >
                <input
                  type="radio"
                  name={`${uid}-provider`}
                  value={id}
                  checked={provider === id}
                  onChange={() => {
                    setProvider(id);
                    setModel("");
                    setModels([]);
                    setStatus({ kind: "idle", msg: "" });
                  }}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-ink">{info.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${info.free ? "bg-ok-50 text-ok" : "bg-surface-2 text-muted"}`}>{info.free ? "Free" : "Paid"}</span>
                </span>
                <span className="text-xs text-muted">{info.tagline}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-ink">2. Get your key</p>
        <p className="text-xs text-muted">A key is like a password that lets ScholarSAT use {p.label} for you. Some of these sites only allow adults to make accounts, so if you&apos;re under 18, ask a parent or teacher to help.</p>
        <ol className="grid gap-2 text-sm text-ink-2">
          {p.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-medium text-ink">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div>
          <a
            href={p.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-bg px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-red hover:text-red"
          >
            {p.keyUrlLabel} <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        {p.note && <p className="rounded-lg bg-surface p-2.5 text-xs text-ink-2">{p.note}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${uid}-key`} className="text-sm font-medium text-ink">3. Paste your key here</label>
        <div className="flex gap-2">
          <input
            id={`${uid}-key`}
            type={show ? "text" : "password"}
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              if (status.kind === "err") setStatus({ kind: "idle", msg: "" });
            }}
            placeholder={`Starts with ${p.keyPrefix}`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
            className="shrink-0 rounded-xl border border-line-strong px-3 text-sm text-muted transition-colors hover:text-ink"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !keyInput.trim()}>{busy ? "Checking…" : "Connect"}</Button>
          {changing && <Button type="button" variant="ghost" onClick={() => { setChanging(false); setStatus({ kind: "idle", msg: "" }); }} disabled={busy}>Cancel</Button>}
        </div>
        <p role="status" className={`min-h-5 text-sm ${status.kind === "err" ? "text-bad" : status.kind === "ok" ? "text-ok" : "text-muted"}`}>{status.msg}</p>
      </div>

      <details className="rounded-xl border border-line bg-surface p-3 text-sm">
        <summary className="cursor-pointer select-none font-medium text-ink-2">Advanced</summary>
        <div className="mt-3 grid gap-2">
          <label htmlFor={`${uid}-model`} className="text-xs text-muted">Choose the AI model yourself. Leave this empty and ScholarSAT picks a good one. Most people never need this.</label>
          <input id={`${uid}-model`} list={`${uid}-models`} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Automatic" spellCheck={false} autoComplete="off" className={inputCls} />
          <datalist id={`${uid}-models`}>{models.map((m) => <option key={m} value={m} />)}</datalist>
        </div>
      </details>

      <p className="text-xs text-muted">
        Your key stays in this browser and goes only to {p.label}. ScholarSAT&apos;s servers never see it. Clearing your browser data removes it.
      </p>
    </form>
  );
}
