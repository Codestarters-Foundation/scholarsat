"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const Credentials = createContext<{
  mode: string;
  setMode: (mode: string) => void;
  key: string;
  setKey: (key: string) => void;
} | null>(null);

export function TutorSession({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState("plan");
  const [key, setKey] = useState("");
  return (
    <Credentials.Provider value={{ mode, setMode, key, setKey }}>
      {children}
    </Credentials.Provider>
  );
}

export function Tutor({ item }: { item: string }) {
  const [open, setOpen] = useState(false);
  const { mode, setMode, key, setKey } = useContext(Credentials)!;
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
  }, [open, refresh]);
  async function explain() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/study/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          mode,
          key: mode === "key" ? key : undefined,
        }),
      });
      const data = await response.json();
      setMessage(response.ok ? data.explanation : data.error);
      if (response.status === 401) await refresh();
    } catch {
      setMessage("Could not reach the tutor. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="tutor" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Ask the AI tutor</summary>
      <label>
        Use{" "}
        <select
          value={mode}
          disabled={busy}
          onChange={(e) => {
            setMode(e.target.value);
            setMessage("");
          }}
        >
          <option value="plan">My ChatGPT plan</option>
          <option value="key">My OpenAI API key</option>
        </select>
      </label>
      {mode === "key" ? (
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
          {origin ? (
            <a href={origin + "/vocab"}>
              Open the local preview to connect ChatGPT
            </a>
          ) : (
            "ChatGPT plan connections require the local edition."
          )}
        </p>
      )}
      <p>
        {mode === "key"
          ? "Your key stays in this tab until you reload or clear it. It is forwarded to OpenAI when you ask. Standard API charges apply."
          : "An explanation uses your connected ChatGPT plan allowance."}{" "}
        Only the exercise is sent.
      </p>
      <button
        disabled={busy || (mode === "plan" ? !connected : !key.trim())}
        onClick={explain}
      >
        {busy ? "Asking OpenAI…" : "Explain this answer"}
      </button>
      <p role="status" className="whitespace-pre-line">
        {message}
      </p>
    </details>
  );
}
