"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

import { AiAsk } from "./AiAsk";
import { TUTOR_SYSTEM } from "@/lib/ai-prompts";
import { IChevD, ISparkle } from "./icons";

const Credentials = createContext<{
  local: boolean;
  mode: string;
  setMode: (mode: string) => void;
  key: string;
  setKey: (key: string) => void;
} | null>(null);

export function TutorSession({ children, local }: { children: ReactNode; local: boolean }) {
  const [mode, updateMode] = useState(local ? "local" : "plan");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ss_tutor_mode");
      if (saved && ["plan", "key", "provider", ...(local ? ["local"] : [])].includes(saved)) updateMode(saved);
    } catch { /* Private browsing can disable storage. */ }
  }, [local]);
  function setMode(value: string) {
    updateMode(value);
    try { sessionStorage.setItem("ss_tutor_mode", value); } catch { /* Tab state still works. */ }
  }
  const [key, setKey] = useState("");
  return (
    <Credentials.Provider value={{ local, mode, setMode, key, setKey }}>
      {children}
    </Credentials.Provider>
  );
}

export function Tutor({ item, hint = false, expanded = false, providerPrompt }: { item: string; hint?: boolean; expanded?: boolean; providerPrompt?: string }) {
  const [open, setOpen] = useState(expanded);
  const { local, mode: preferredMode, setMode, key, setKey } = useContext(Credentials)!;
  const mode = preferredMode === "provider" && !providerPrompt ? (local ? "local" : "plan") : preferredMode;
  const [connected, setConnected] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/study/connect", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const state = await response.json();
      setConnected(state.connected);
      setOrigin(state.origin);
    } catch {
      setMessage("Could not check your connection.");
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [open, mode, refresh]);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  async function explain() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/study/tutor", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          task: hint ? "hint" : "explain",
          mode,
          key: mode === "key" ? key : undefined,
        }),
      });
      const data = await response.json();
      setMessage(response.ok ? data.explanation : data.error);
      if (response.status === 401) await refresh();
    } catch {
      if (!controller.signal.aborted) setMessage("Could not reach the tutor. Try again.");
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <details className="tutor" open={open} onToggle={e => setOpen(e.currentTarget.open)} onKeyDown={e => e.stopPropagation()}>
      <summary><ISparkle /> AI tutor <IChevD /></summary>
      <div className="tutor-body">
      <label>
        Connection{" "}
        <select
          value={mode}
          disabled={busy}
          onChange={(e) => {
            setMode(e.target.value);
            setMessage("");
          }}
        >
          {local && <option value="local">Local model</option>}
          <option value="plan">My ChatGPT plan</option>
          <option value="key">My OpenAI API key</option>
          {providerPrompt && <option value="provider">Other AI providers</option>}
        </select>
      </label>
      {mode === "provider" && providerPrompt ? <AiAsk label={hint ? "Give me a hint" : "Explain this answer"} system={TUTOR_SYSTEM} prompt={providerPrompt} /> : mode === "local" ? (
        connected ? <button onClick={() => setMode("plan")}>Use my connected ChatGPT plan</button>
          : origin && origin === window.location.origin ? <form method="POST" action="/api/study/connect" target="_blank" onSubmit={() => setMode("plan")}>
              <button>Continue with ChatGPT</button>
            </form> : origin ? <a href={origin + "/tutor"}>Link my ChatGPT plan</a> : null
      ) : mode === "key" ? (
        <label>
          OpenAI API key
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
      ) : connected ? (
        <div className="tutor-actions">
          ChatGPT connected{" "}
          <button
            onClick={async () => {
              try {
                const r = await fetch("/api/study/connect", {
                  method: "DELETE",
                });
                if (!r.ok) throw new Error();
                await refresh();
              } catch {
                setMessage("Could not disconnect. Try again.");
              }
            }}
          >
            Disconnect
          </button>
        </div>
      ) : origin &&
        typeof window !== "undefined" &&
        origin === window.location.origin ? (
        <form method="POST" action="/api/study/connect" target="_blank">
          <button>Continue with ChatGPT</button>
        </form>
      ) : (
        <p>
          {origin && typeof window !== "undefined" ? (
            <a href={origin + window.location.pathname + window.location.search}>
              Open the local preview to connect ChatGPT
            </a>
          ) : (
            "ChatGPT plan connections require the local edition."
          )}
        </p>
      )}
      {mode !== "provider" && <><p>{mode === "local" ? "Runs on this computer. No account or credits needed." : mode === "key"
        ? "Your key stays in this tab. Asking sends the exercise to OpenAI and uses API billing."
        : "Asking sends the exercise to OpenAI and uses your connected plan."}</p>
      <button
        className="tutor-ask"
        disabled={busy || (mode === "plan" && !connected) || (mode === "key" && !key.trim())}
        onClick={explain}
      >
        {busy ? "Thinking…" : hint ? "Give me a hint" : "Explain this answer"}
      </button></>}
      <p role="status" className="whitespace-pre-line">
        {message}
      </p>
      </div>
    </details>
  );
}
