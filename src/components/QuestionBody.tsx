"use client";
import { Rich } from "./Rich";
import type { Question } from "@/lib/types";

type PQ = Omit<Question, "answer" | "explanation">;

export function Passage({ q }: { q: PQ }) {
  if (!q.passage && !q.table) return null;
  return (
    <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink">
      {q.passage && <Rich text={q.passage} />}
      {q.passage2 && <Rich text={q.passage2} className="border-t border-line pt-4" />}
      {q.table && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-sm">
            {q.table.caption && <caption className="mb-2 text-left font-semibold">{q.table.caption}</caption>}
            <thead>
              <tr>
                {q.table.headers.map((h, i) => (
                  <th key={i} className="border border-line bg-surface px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} className={`border border-line px-3 py-2 ${j === 0 ? "font-medium" : "tabular-nums"}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const L = ["A", "B", "C", "D"];

export function Choices({
  q,
  selected,
  onSelect,
  struck,
  onStrike,
  reveal,
  disabled,
}: {
  q: PQ;
  selected: string;
  onSelect: (v: string) => void;
  struck?: Set<string>;
  onStrike?: (l: string) => void;
  reveal?: { answer: string } | null;
  disabled?: boolean;
}) {
  return (
    <fieldset className="grid gap-2.5">
      <legend className="sr-only">Answer choices</legend>
      {q.choices!.map((c, i) => {
        const l = L[i];
        const isSel = selected === l;
        const isStruck = struck?.has(l);
        const isAns = reveal?.answer === l;
        const wrongSel = reveal && isSel && !isAns;
        const tone = isAns
          ? "border-ok bg-ok-50"
          : wrongSel
            ? "border-bad bg-bad-50"
            : isSel
              ? "border-red bg-red-50 ring-1 ring-red"
              : "border-line bg-white hover:border-ink/30";
        return (
          <div key={l} className="flex items-stretch gap-2">
            <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${tone} ${disabled ? "cursor-default" : ""}`}>
              <input type="radio" name={`q-${q.id}`} className="sr-only" checked={isSel} disabled={disabled} onChange={() => onSelect(l)} />
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-semibold ${
                  isAns ? "border-ok bg-ok text-white" : wrongSel ? "border-bad bg-bad text-white" : isSel ? "border-red bg-red text-white" : "border-line text-ink"
                }`}
              >
                {l}
              </span>
              <Rich text={c} className={`min-w-0 flex-1 ${isStruck ? "text-muted line-through decoration-2" : ""}`} />
            </label>
            {onStrike && !reveal && (
              <button
                type="button"
                onClick={() => onStrike(l)}
                className={`w-10 shrink-0 rounded-xl border text-xs font-semibold ${isStruck ? "border-ink bg-ink text-white" : "border-line text-muted hover:border-ink/30"}`}
                aria-pressed={isStruck}
                aria-label={isStruck ? `Undo eliminate choice ${l}` : `Eliminate choice ${l}`}
                title="Eliminate choice"
              >
                <span className="line-through">{l}</span>
              </button>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}

export function SprInput({ value, onChange, disabled, reveal }: { value: string; onChange: (v: string) => void; disabled?: boolean; reveal?: { answer: string; correct: boolean } | null }) {
  return (
    <div className="max-w-xs">
      <label className="mb-1.5 block text-sm font-semibold" htmlFor="spr">Your answer</label>
      <input
        id="spr"
        inputMode="text"
        autoComplete="off"
        maxLength={7}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9./-]/g, ""))}
        className={`w-full rounded-xl border px-4 py-3 text-lg tabular-nums outline-none focus:border-red focus:ring-1 focus:ring-red ${
          reveal ? (reveal.correct ? "border-ok bg-ok-50" : "border-bad bg-bad-50") : "border-line"
        }`}
        placeholder="e.g. 12, -3, 2/3, .75"
      />
      <p className="mt-1.5 text-xs text-muted">Enter a whole number, decimal, or fraction. Negative answers are allowed.</p>
      {reveal && !reveal.correct && (
        <p className="mt-2 text-sm">
          Correct answer: <span className="font-semibold text-ok">{reveal.answer}</span>
        </p>
      )}
    </div>
  );
}
