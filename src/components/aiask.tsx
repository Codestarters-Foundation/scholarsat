"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui";
import { ISparkle } from "./icons";
import { AiKeyForm } from "./AiSettings";
import { useAiConfig } from "@/lib/use-ai-config";
import { AiError, PROVIDERS, streamChat } from "@/lib/ai";

type State = "idle" | "loading" | "done" | "error";

/**
 * An optional "ask AI" button. Uses the student's own key (see AiSettings). Without a key it shows a
 * quiet link that opens the key form right here, so it also works when signed out.
 */
export function AiAsk({ label, system, prompt }: { label: string; system: string; prompt: string }) {
  const cfg = useAiConfig();
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [setup, setSetup] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const run = useCallback(async () => {
    if (!cfg) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setState("loading");
    setText("");
    setErr("");
    try {
      await streamChat(cfg, {
        system,
        messages: [{ role: "user", content: prompt }],
        signal: ac.signal,
        onText: (d) => setText((t) => t + d),
      });
      if (!ac.signal.aborted) setState("done");
    } catch (e) {
      if (ac.signal.aborted) return;
      setErr(e instanceof AiError ? e.message : "Something went wrong. Try again.");
      setState("error");
    }
  }, [cfg, system, prompt]);

  const stop = () => {
    abort.current?.abort();
    setState(text ? "done" : "idle");
  };

  if (cfg === undefined) return null;

  if (cfg === null) {
    return setup ? (
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm text-ink-2">
          Use your own AI key to get this. It stays in this browser and is optional.
        </p>
        <AiKeyForm onSaved={() => setSetup(false)} />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setSetup(true)}
        className="inline-flex items-center gap-1.5 text-left text-xs text-muted transition-colors hover:text-red"
      >
        <ISparkle className="h-3.5 w-3.5" /> {label} with AI · add your own key
      </button>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {state === "loading" ? (
          <Button type="button" variant="secondary" size="sm" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={run}>
            <ISparkle className="h-4 w-4" /> {state === "done" || state === "error" ? "Ask again" : label}
          </Button>
        )}
        <span className="text-xs text-faint">
          {PROVIDERS[cfg.provider].label} · {cfg.model}
        </span>
        <button type="button" onClick={() => setSetup((s) => !s)} className="text-xs text-muted hover:text-red">
          {setup ? "Close" : "Change key"}
        </button>
      </div>
      {setup && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <AiKeyForm onSaved={() => setSetup(false)} />
        </div>
      )}
      {(text || state === "loading") && (
        <div
          aria-busy={state === "loading"}
          className="whitespace-pre-wrap rounded-xl border border-line bg-bg p-3.5 text-sm leading-relaxed text-ink-2"
        >
          {text || "Thinking…"}
        </div>
      )}
      {state === "error" && (
        <p role="alert" className="text-xs text-bad">
          {err}
        </p>
      )}
      {state === "done" && (
        <p className="text-xs text-faint">AI can be wrong. If it disagrees with the official explanation, trust the official one.</p>
      )}
    </div>
  );
}
