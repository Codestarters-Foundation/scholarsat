"use client";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { Box } from "@/lib/tutor-anchor";
import type { MarkKind } from "@/lib/tutor-lesson";

/** One drawing, placed. Built by TutorTray from a Mark and the boxes tutor-anchor measured. */
export type Placed = {
  id: string;
  kind: MarkKind;
  boxes: Box[];
  /** x where the content column starts; margin numbers are placed just left of it */
  gutter: number | null;
  host: HTMLElement;
  /** number shown on the drawing, when the mark has a note */
  badge?: number;
  /** from an earlier step: shown faded */
  old: boolean;
};

const COLOR: Record<MarkKind, string> = {
  highlight: "#f5b700",
  underline: "#2f6df0",
  circle: "#e5484d",
  strike: "#e5484d",
  check: "#1f9d55",
};

export const MARK_CSS = `
@keyframes ss-t-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes ss-t-sweep { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes ss-t-pop { from { opacity: 0; transform: scale(.4) } to { opacity: 1; transform: scale(1) } }
@keyframes ss-t-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ss-t-write { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
.ss-t-mark { transition: opacity .3s ease; }
.ss-t-mark[data-old="true"] { opacity: .32; }
.ss-t-stroke { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: ss-t-draw .7s cubic-bezier(.3,.6,.3,1) both; animation-delay: var(--d, 0s); }
.ss-t-hl { transform-origin: left center; animation: ss-t-sweep .5s cubic-bezier(.3,.6,.3,1) both; animation-delay: var(--d, 0s); }
.ss-t-badge { animation: ss-t-pop .25s ease-out both; animation-delay: var(--d, 0s); }
.ss-t-box { animation: ss-t-fade .4s ease-out both; animation-delay: var(--d, 0s); }
.ss-t-write { animation: ss-t-write .7s steps(24, end) both; animation-delay: var(--d, 0s); }
@media (prefers-reduced-motion: reduce) {
  .ss-t-stroke, .ss-t-hl, .ss-t-badge, .ss-t-box, .ss-t-write { animation: none !important; }
}
`;

/** Small deterministic random numbers, so a drawing never changes shape between renders. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const f = (n: number) => n.toFixed(1);

/** A hand-drawn looking straight line (underline / strike): a few points with a slight wobble. */
export function wobblyLine(x1: number, y1: number, x2: number, y2: number, seed: number): string {
  const r = rng(seed);
  const n = Math.max(2, Math.round(Math.abs(x2 - x1) / 18));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const jitter = i === 0 || i === n ? 0 : (r() - 0.5) * 2.2;
    pts.push(`${f(x1 + (x2 - x1) * t)},${f(y1 + (y2 - y1) * t + jitter)}`);
  }
  return "M" + pts.join(" L");
}

/** A loop drawn around a box, like a pen circling a word: slightly uneven and overshooting its start. */
export function loopPath(b: Box, seed: number): string {
  const r = rng(seed);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const rx = b.w / 2 + 9, ry = b.h / 2 + 5;
  const phase = r() * 6.28;
  const N = 44;
  const start = -Math.PI * 0.62;
  const sweep = Math.PI * 2.08;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = start + (sweep * i) / N;
    const wob = 1 + 0.035 * Math.sin(3 * t + phase);
    const drift = (i / N) * 3.5; // the pen ends a little off where it started
    pts.push(`${f(cx + rx * wob * Math.cos(t))},${f(cy + ry * wob * Math.sin(t) + drift)}`);
  }
  return "M" + pts.join(" L");
}

function unite(boxes: Box[]): Box {
  const x1 = Math.min(...boxes.map((b) => b.x)), y1 = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.w)), y2 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function Drawing({ p }: { p: Placed }) {
  const color = COLOR[p.kind];
  const seed = hashSeed(p.id);
  const lines = p.boxes;
  const u = unite(lines);
  let shape: ReactNode = null;

  if (p.kind === "highlight") {
    shape = lines.map((b, i) => (
      <div
        key={i}
        className="ss-t-hl"
        style={{ position: "absolute", left: b.x - 2, top: b.y + 1, width: b.w + 4, height: Math.max(8, b.h - 2), borderRadius: 4, background: color, opacity: 0.4, ["--d" as string]: `${i * 0.12}s` }}
      />
    ));
  } else if (p.kind === "check") {
    shape = (
      <div
        className="ss-t-box"
        style={{ position: "absolute", left: u.x - 5, top: u.y - 3, width: u.w + 10, height: u.h + 6, borderRadius: 10, border: `2.5px solid ${color}`, background: `${color}14` }}
      />
    );
  } else {
    shape = (
      <svg width="1" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {lines.map((b, i) => {
          const d =
            p.kind === "underline"
              ? wobblyLine(b.x, b.y + b.h - 1, b.x + b.w, b.y + b.h - 1 + (seed % 3) * 0.3, seed + i)
              : p.kind === "strike"
                ? wobblyLine(b.x - 1, b.y + b.h * 0.55, b.x + b.w + 1, b.y + b.h * 0.5, seed + i)
                : loopPath(b, seed + i);
          return (
            <path
              key={i}
              d={d}
              pathLength={1}
              className="ss-t-stroke"
              stroke={color}
              strokeWidth={p.kind === "strike" ? 2.5 : 2.6}
              style={{ ["--d" as string]: `${i * 0.18}s` }}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <div className="ss-t-mark" data-mark={p.id} data-kind={p.kind} data-old={p.old ? "true" : "false"}>
      {/* An invisible box exactly where the drawing is, so the page can scroll it into view. */}
      <span data-anchor style={{ position: "absolute", left: u.x - 6, top: u.y - 6, width: u.w + 12, height: u.h + 12 }} />
      {shape}
      {p.badge ? (
        <span
          className="ss-t-badge"
          style={{
            position: "absolute",
            left: Math.max(2, (p.gutter ?? u.x) - 24),
            top: lines[0].y + (lines[0].h - 18) / 2,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: color,
            color: "#fff",
            font: "600 11px/18px system-ui, sans-serif",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,.35)",
            ["--d" as string]: "0.35s",
          }}
        >
          {p.badge}
        </span>
      ) : null}
    </div>
  );
}

/** Puts every drawing into the layer that belongs to its region of the page. */
export function MarkLayers({ placed }: { placed: Placed[] }) {
  const byHost = new Map<HTMLElement, Placed[]>();
  for (const p of placed) byHost.set(p.host, [...(byHost.get(p.host) ?? []), p]);
  return (
    <>
      {[...byHost].map(([host, list]) =>
        createPortal(
          <>
            {list.map((p) => (
              <Drawing key={p.id} p={p} />
            ))}
          </>,
          host,
          list[0].id,
        ),
      )}
    </>
  );
}
