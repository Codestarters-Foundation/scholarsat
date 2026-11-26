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
import { IArrowR, ICheck, IChevD, IKey, ILink, ISparkle } from "./icons";
import "./study-connection.css";

const Credentials = createContext<{
  chosen: boolean;
  mode: string;
  setMode: (mode: string) => void;
  key: string;
  setKey: (key: string) => void;
} | null>(null);

export function useTutorConnection() { return useContext(Credentials)!; }

export function TutorSession({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState(false);
  const [mode, updateMode] = useState("plan");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ss_tutor_mode");
      if (saved && ["plan", "key", "provider"].includes(saved)) { updateMode(saved); setChosen(true); }
    } catch { /* Private browsing can disable storage. */ }
  }, []);
  const setMode = useCallback((value: string) => {
    updateMode(value);
    setChosen(true);
    try { sessionStorage.setItem("ss_tutor_mode", value); } catch { /* Tab state still works. */ }
  },[]);
  const [key, setKey] = useState("");
  return (
    <Credentials.Provider value={{ chosen, mode, setMode, key, setKey }}>
      {children}
    </Credentials.Provider>
  );
}

export function Tutor({ item, hint = false, expanded = false, providerPrompt }: { item: string; hint?: boolean; expanded?: boolean; providerPrompt?: string }) {
  const [open, setOpen] = useState(expanded);
  const { mode: preferredMode, setMode, key, setKey } = useTutorConnection();
  const mode = preferredMode === "provider" && !providerPrompt ? "plan" : preferredMode;
  const [connected, setConnected] = useState<boolean | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/study/connect", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const state = await response.json();
      setConnected(state.connected);
      setConnectionError(false);
      if (state.connected) setWaiting(false);
      setOrigin(state.origin);
    } catch {
      setConnectionError(true);
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [open, mode, refresh]);
  useEffect(() => {
    if (!waiting || !open) return;
    const timer = window.setInterval(refresh, 3000);
    const timeout = window.setTimeout(() => setWaiting(false), 120000);
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [waiting, open, refresh]);
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
  const modeNames: Record<string,string> = {plan:"My ChatGPT plan", key:"OpenAI API key", provider:"Other AI providers"};
  const status = mode === "key" ? (key.trim() ? "Key entered in this tab" : "Enter a key below") : mode === "provider" ? "Use a provider key" : connectionError ? "Connection check failed" : connected === null ? "Checking connection…" : connected ? "Connected" : waiting ? "Waiting for sign-in…" : "Sign-in required";
  const Icon = mode === "key" ? IKey : mode === "plan" && connected ? ICheck : ILink;
  const localTab = typeof window !== "undefined" && origin === window.location.origin;
  const select = (next: string) => { setMode(next); setWaiting(false); setMessage(""); };
  const askLabel = hint ? "Give me a hint" : "Explain this answer";
  return (
    <details className="tutor study-tutor" open={open} onToggle={e => setOpen(e.currentTarget.open)} onKeyDown={e => e.stopPropagation()}>
      <summary><ISparkle /> AI tutor <IChevD /></summary>
      <div className="tutor-body">
        <label className="connection-label">
          Connection
          <span className="connection-pick">
            <Icon /><span aria-hidden="true"><strong>{modeNames[mode]}</strong><small>{status}</small></span><IChevD />
            <select aria-label="Connection" value={mode} disabled={busy} onChange={e=>select(e.target.value)}>
              <option value="plan">My ChatGPT plan</option><option value="key">OpenAI API key</option>
              {providerPrompt && <option value="provider">Other AI providers</option>}
            </select>
          </span>
        </label>
        <div className="connection-view" key={mode}>
          {mode === "provider" && providerPrompt ? <AiAsk label={askLabel} system={TUTOR_SYSTEM} prompt={providerPrompt}/> : <>
            <p className="connection-note">{mode === "key" ? "Your key stays in this tab. Each request uses your OpenAI API billing." : connected ? "Hints and explanations use your connected ChatGPT plan." : waiting ? "Finish signing in to OpenAI in the other tab, then return to this exercise." : "Sign in with OpenAI to use your ChatGPT plan for hints and explanations."}</p>
            {mode === "key" && <label className="connection-key">OpenAI API key<input type="password" autoComplete="off" spellCheck={false} value={key} onChange={e=>setKey(e.target.value)}/></label>}
            {mode === "plan" && !connected ? connectionError ? <button onClick={refresh}>Retry connection check</button> : connected !== null && (localTab ?
              <form method="POST" action="/api/study/connect" target="_blank" rel="noopener" onSubmit={()=>{ setMode("plan"); setWaiting(true); }}>
                <button className="tutor-ask">{waiting ? "Restart sign-in" : "Continue with ChatGPT"} <IArrowR /></button>
              </form> : origin ? <a className="connection-link" href={origin+window.location.pathname+window.location.search}>Open the local preview to connect <IArrowR /></a> : <p>ChatGPT plan connections require the local edition.</p>)
              : <button className="tutor-ask" data-ask disabled={busy || (mode==="key" && !key.trim())} onClick={()=>explain()}>{busy ? "Thinking…" : askLabel}{!busy && <IArrowR />}</button>}
          </>}
        </div>
        <div className="connection-foot">
          {mode === "plan" && connected && <button type="button" className="connection-link" disabled={busy} onClick={async()=>{
            try {
              const r = await fetch("/api/study/connect",{method:"DELETE"});
              if(!r.ok) throw new Error();
              setConnected(false); setWaiting(false); setMessage("ChatGPT disconnected.");
            } catch { setMessage("Could not disconnect. Try again."); }
          }}>Disconnect ChatGPT</button>}
        </div>
        <p role="status" aria-live="polite" className="connection-answer whitespace-pre-line">{message}</p>
      </div>
    </details>
  );
}
