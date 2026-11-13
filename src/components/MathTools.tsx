"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DesmosCalculator, DESMOS_ENABLED } from "./DesmosCalculator";
import { Rich } from "./Rich";
import { IX } from "./icons";

const REF = [
  ["Circle", "\\(A = \\pi r^2\\), \\(C = 2\\pi r\\)"],
  ["Rectangle", "\\(A = \\ell w\\)"],
  ["Triangle", "\\(A = \\tfrac{1}{2}bh\\)"],
  ["Pythagorean theorem", "\\(c^2 = a^2 + b^2\\)"],
  ["Special right triangles", "\\(x,\\ x\\sqrt{3},\\ 2x\\) (30°-60°-90°) and \\(s,\\ s,\\ s\\sqrt{2}\\) (45°-45°-90°)"],
  ["Rectangular prism", "\\(V = \\ell wh\\)"],
  ["Cylinder", "\\(V = \\pi r^2 h\\)"],
  ["Sphere", "\\(V = \\tfrac{4}{3}\\pi r^3\\)"],
  ["Cone", "\\(V = \\tfrac{1}{3}\\pi r^2 h\\)"],
  ["Pyramid", "\\(V = \\tfrac{1}{3}\\ell wh\\)"],
  ["Facts", "A circle has \\(360°\\) or \\(2\\pi\\) radians. The angles of a triangle sum to \\(180°\\)."],
];

export const DESMOS_URL = "https://www.desmos.com/calculator";

/** Floating reference sheet panel used by the practice player and test runner. */
export function ReferenceSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed right-4 top-20 z-50 w-[min(92vw,420px)] animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-pop" role="dialog" aria-label="Reference sheet">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <p className="font-medium">Reference sheet</p>
        <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close reference sheet"><IX className="h-4 w-4" /></button>
      </div>
      <dl className="scroll-thin grid max-h-[60vh] gap-3 overflow-y-auto p-4 text-sm">
        {REF.map(([k, v]) => (
          <div key={k}>
            <dt className="font-medium">{k}</dt>
            <dd className="text-ink-2"><Rich text={v} as="span" /></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Icon-over-label button for the dark/red tool bars. */
export function ToolButton({ icon, label, onClick, href, active }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string; active?: boolean }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcMounted, setCalcMounted] = useState(false);
  const cls = `flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[12px] transition-colors ${active || calcOpen ? "bg-white/20" : "hover:bg-white/10"}`;
  // The calculator button opens an embedded Desmos panel when an API key is configured.
  if (href === DESMOS_URL && DESMOS_ENABLED)
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setCalcMounted(true);
            setCalcOpen((o) => !o);
          }}
          aria-pressed={calcOpen}
          className={cls}
        >
          {icon}
          <span>{label}</span>
        </button>
        {calcMounted && createPortal(<DesmosCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />, document.body)}
      </>
    );
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {icon}
        <span>{label}</span>
      </a>
    );
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cls}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
