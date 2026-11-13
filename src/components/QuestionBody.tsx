"use client";
import { Rich } from "./Rich";
import type { Question } from "@/lib/types";

type PQ = Omit<Question, "answer" | "explanation">;

export function Passage({ q }: { q: PQ }) {
  if (!q.passage && !q.table) return null;
  return (
    <div className="space-y-5 text-[17px] leading-relaxed text-ink">
      {q.passage && <Rich text={q.passage} />}
      {q.passage2 && <Rich text={q.passage2} className="border-t border-line pt-5" />}
      {q.table && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-[15px]">
            {q.table.caption && <caption className="mb-2 text-left font-medium">{q.table.caption}</caption>}
            <thead>
              <tr>
                {q.table.headers.map((h, i) => (
                  <th key={i} className="border border-line-strong bg-surface px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} className={`border border-line-strong px-3 py-2 ${j === 0 ? "font-medium" : "tabular-nums"}`}>{c}</td>
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
  /** When provided, an eliminate button is shown beside each choice. */
  onStrike?: (l: string) => void;
  reveal?: { answer: string } | null;
  disabled?: boolean;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">Answer choices</legend>
      {q.choices!.map((c, i) => {
        const l = L[i];
        const isSel = selected === l;
        const isStruck = struck?.has(l);
        const isAns = reveal?.answer === l;
        const wrongSel = reveal && isSel && !isAns;
        const tone = isAns
          ? "border-ok-500 bg-ok-50"
          : wrongSel
            ? "border-bad bg-bad-50"
            : isSel
              ? "border-red bg-red-50"
              : "border-line-strong bg-white hover:border-ink/40";
        return (
          <div key={l} className="flex items-stretch gap-2">
            <label className={`flex min-h-[64px] flex-1 items-center gap-4 rounded-xl border-2 px-4 py-3 transition-colors ${tone} ${disabled ? "cursor-default" : "cursor-pointer"}`}>
              <input type="radio" name={`q-${q.id}`} className="sr-only" checked={isSel} disabled={disabled} onChange={() => onSelect(l)} />
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-medium transition-colors ${
                  isAns ? "border-ok-500 bg-ok-500 text-white" : wrongSel ? "border-bad bg-bad text-white" : isSel ? "border-red bg-red text-white" : "border-ink/70 text-ink"
                }`}
              >
                {l}
              </span>
              <Rich text={c} className={`min-w-0 flex-1 text-[16px] ${isStruck ? "text-faint line-through decoration-2" : ""}`} />
            </label>
            {onStrike && !reveal && (
              <button
                type="button"
                onClick={() => onStrike(l)}
                className={`w-11 shrink-0 rounded-xl border-2 text-xs font-medium ${isStruck ? "border-ink bg-ink text-white" : "border-line text-muted hover:border-ink/30"}`}
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
      <label className="mb-1.5 block text-sm font-medium" htmlFor="spr">Your answer</label>
      <input
        id="spr"
        inputMode="text"
        autoComplete="off"
        maxLength={7}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9./-]/g, ""))}
        className={`w-full rounded-xl border-2 px-4 py-3 font-mono text-xl tabular-nums outline-none focus:border-red ${
          reveal ? (reveal.correct ? "border-ok-500 bg-ok-50" : "border-bad bg-bad-50") : "border-line-strong"
        }`}
        placeholder="e.g. 2/3"
      />
      <p className="mt-1.5 text-xs text-muted">Whole number, decimal, or fraction. Negatives allowed.</p>
      {reveal && !reveal.correct && (
        <p className="mt-2 text-sm">
          Correct answer: <span className="font-medium text-ok">{reveal.answer}</span>
        </p>
      )}
    </div>
  );
}
