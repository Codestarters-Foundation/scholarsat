"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui";
import { ISparkle } from "./icons";
import { AiConnect } from "./AiConnect";
import { useAiConfig } from "@/lib/use-ai-config";
import { AiError, PROVIDERS, repairModel, saveAiConfig, streamChat, type AiConfig } from "@/lib/ai";

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
    const attempt = (c: AiConfig) =>
      streamChat(c, {
        system,
        messages: [{ role: "user", content: prompt }],
        signal: ac.signal,
        onText: (d) => setText((t) => t + d),
      });
    try {
      try {
        await attempt(cfg);
      } catch (e) {
        // Providers retire models. If ours is gone, quietly switch to one that works and try once more.
        if (!(e instanceof AiError) || e.kind !== "model" || ac.signal.aborted) throw e;
        const fixed = await repairModel(cfg);
        if (!fixed || ac.signal.aborted) throw e;
        saveAiConfig(fixed);
        setText("");
        await attempt(fixed);
      }
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
          Connect your own AI account to get this. It can be free, it stays in this browser, and it is optional.
        </p>
        <AiConnect onConnected={() => setSetup(false)} />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setSetup(true)}
        className="inline-flex items-center gap-1.5 text-left text-xs text-muted transition-colors hover:text-red"
      >
        <ISparkle className="h-3.5 w-3.5" /> {label} with AI · set up free AI
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
          {PROVIDERS[cfg.provider].label}
        </span>
        <button type="button" onClick={() => setSetup((s) => !s)} className="text-xs text-muted hover:text-red">
          {setup ? "Close" : "Settings"}
        </button>
      </div>
      {setup && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <AiConnect onConnected={() => setSetup(false)} />
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
