"use client";

import { useEffect, useRef, useState } from "react";
import { IX } from "./icons";

type Calculator = { resize: () => void; destroy: () => void };
type Factory = (el: HTMLElement, options?: Record<string, unknown>) => Calculator;

declare global {
  interface Window {
    Desmos?: { GraphingCalculator: Factory; ScientificCalculator: Factory };
  }
}

const API_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY;
/** Without a key the Calculator button falls back to opening desmos.com in a new tab. */
export const DESMOS_ENABLED = Boolean(API_KEY);

const SCRIPT_SRC = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${API_KEY}`;

/** Desmos ships as a global script, so load it once per page however many times the panel mounts. */
let scriptPromise: Promise<void> | null = null;
function loadDesmos(): Promise<void> {
  if (window.Desmos) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        scriptPromise = null;
        reject(new Error("The calculator could not load. Check your connection and try again."));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type Mode = "graphing" | "scientific";
const MODES: { id: Mode; label: string }[] = [
  { id: "graphing", label: "Graphing" },
  { id: "scientific", label: "Scientific" },
];

/**
 * Floating, draggable Desmos calculator with a graphing and a scientific tab. Both stay mounted
 * (and the whole panel stays mounted while hidden) so a student's work survives switching tabs and
 * closing the panel mid-question or mid-test.
 */
export function DesmosCalculator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hosts = useRef<Record<Mode, HTMLDivElement | null>>({ graphing: null, scientific: null });
  const calcs = useRef<Partial<Record<Mode, Calculator>>>({});
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  // Only mounted after a click, so `window` is always available here.
  const [pos, setPos] = useState(() => ({ x: Math.max(8, window.innerWidth - Math.min(460, window.innerWidth * 0.92) - 16), y: 80 }));
  const [mode, setMode] = useState<Mode>("graphing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const observers: ResizeObserver[] = [];
    loadDesmos()
      .then(() => {
        const D = window.Desmos;
        if (!live || !D) return;
        const g = hosts.current.graphing;
        const s = hosts.current.scientific;
        if (g) calcs.current.graphing = D.GraphingCalculator(g, { keypad: true, expressions: true, settingsMenu: true });
        if (s) calcs.current.scientific = D.ScientificCalculator(s);
        (Object.keys(calcs.current) as Mode[]).forEach((m) => {
          const el = hosts.current[m];
          if (!el) return;
          const ro = new ResizeObserver(() => calcs.current[m]?.resize());
          ro.observe(el);
          observers.push(ro);
        });
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : "The calculator could not load."));
    const current = calcs.current;
    return () => {
      live = false;
      observers.forEach((o) => o.disconnect());
      Object.values(current).forEach((c) => c?.destroy());
      calcs.current = {};
    };
  }, []);

  // A calculator drawn while hidden has no size, so re-measure whenever it becomes visible.
  useEffect(() => {
    if (open) calcs.current[mode]?.resize();
  }, [open, mode]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setPos({
      x: Math.min(window.innerWidth - 120, Math.max(8 - 340, d.x + e.clientX - d.px)),
      y: Math.min(window.innerHeight - 48, Math.max(0, d.y + e.clientY - d.py)),
    });
  }

  return (
    <div
      role="dialog"
      aria-label="Calculator"
      hidden={!open}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 flex h-[min(70vh,560px)] w-[min(92vw,460px)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-pop"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="flex shrink-0 cursor-grab touch-none items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2 select-none active:cursor-grabbing"
      >
        <div role="tablist" aria-label="Calculator type" className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${mode === m.id ? "bg-white text-ink shadow-card" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close calculator">
          <IX className="h-4 w-4" />
        </button>
      </div>
      {error ? (
        <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted">
          <p>
            {error}{" "}
            <a href="https://www.desmos.com/calculator" target="_blank" rel="noopener noreferrer" className="font-medium text-red underline underline-offset-2">
              Open Desmos in a new tab
            </a>
          </p>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          {MODES.map((m) => (
            <div
              key={m.id}
              ref={(el) => {
                hosts.current[m.id] = el;
              }}
              role="tabpanel"
              aria-label={`${m.label} calculator`}
              hidden={mode !== m.id}
              className="absolute inset-0"
            />
          ))}
        </div>
      )}
    </div>
  );
}
