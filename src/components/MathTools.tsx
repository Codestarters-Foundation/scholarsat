"use client";
import { useState } from "react";
import { ICalc } from "./icons";
import { Rich } from "./Rich";

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

export function MathTools() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href="https://www.desmos.com/calculator"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium hover:border-red/40"
      >
        <ICalc className="h-4 w-4" /> Desmos calculator
      </a>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium hover:border-red/40">
        Reference sheet
      </button>
      {open && (
        <div className="mt-2 w-full rounded-xl border border-gold-100 bg-gold-50 p-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {REF.map(([k, v]) => (
              <div key={k}>
                <dt className="font-semibold">{k}</dt>
                <dd><Rich text={v} as="span" /></dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
