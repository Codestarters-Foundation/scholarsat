"use client";
import type { ReactNode } from "react";
import type { Step } from "@/lib/tutor-lesson";

/** Plain-text math → something readable: x^2 as a superscript, sqrt( as a root sign, <= as ≤. */
export function renderMath(s: string): ReactNode[] {
  const t = s
    .replace(/<=/g, "≤")
    .replace(/>=/g, "≥")
    .replace(/!=/g, "≠")
    .replace(/sqrt\(/gi, "√(")
    .replace(/(\d|\)|\s)\*(\d|\(|\s)/g, "$1 × $2")
    .replace(/ +/g, " ");
  const out: ReactNode[] = [];
  const re = /\^(\([^)]*\)|-?[A-Za-z0-9.]+)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(t.slice(last, m.index));
    out.push(<sup key={i++}>{m[1].replace(/^\(|\)$/g, "")}</sup>);
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push(t.slice(last));
  return out;
}

/**
 * The math "board": every line written so far, step by step. Lines from the step on screen are written out
 * with a pen-like reveal; older lines stay put in a calmer colour.
 */
export function Whiteboard({ steps, upTo }: { steps: Step[]; upTo: number }) {
  const shown = steps.slice(0, upTo + 1);
  if (!shown.some((s) => s.board.length)) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-4" aria-label="Whiteboard" role="group">
      <p className="eyebrow mb-2 text-muted">Whiteboard</p>
      <div className="grid gap-1.5 font-mono text-[17px] leading-snug tabular-nums">
        {shown.map((s, si) =>
          s.board.map((line, li) => {
            const current = si === upTo;
            return (
              <div
                key={`${si}-${li}`}
                data-board-line
                data-current={current ? "true" : "false"}
                className={current ? "text-ink" : "text-ink-2"}
                style={{ borderTop: li === 0 && si > 0 && shown.slice(0, si).some((x) => x.board.length) ? "1px dashed var(--line, rgba(128,128,128,.35))" : undefined, paddingTop: li === 0 && si > 0 ? 6 : 0 }}
              >
                <span className={current ? "ss-t-write inline-block" : "inline-block"} style={{ ["--d" as string]: `${li * 0.5}s` }}>
                  {renderMath(line)}
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
