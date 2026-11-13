"use client";
import { curveHeight, ordinal, percentile, scoreTier } from "@/lib/onboarding";

const W = 400;
const H = 150;
const PAD = 14;
const MIN = 400;
const MAX = 1600;
const x = (s: number) => PAD + ((s - MIN) / (MAX - MIN)) * (W - PAD * 2);
const y = (s: number) => H - 18 - curveHeight(s) * (H - 48);

const pts = Array.from({ length: 121 }, (_, i) => MIN + i * 10);
const line = pts.map((s, i) => `${i ? "L" : "M"}${x(s).toFixed(1)} ${y(s).toFixed(1)}`).join(" ");

/** Bell curve of national scores with a draggable marker. `from` draws a faint marker for where the student is now. */
export function ScoreCurve({ value, onChange, from, presets }: { value: number; onChange: (v: number) => void; from?: number | null; presets?: number[] }) {
  const clipId = "area-clip";
  const px = x(value);
  const area = `${line} L${W - PAD} ${H - 18} L${PAD} ${H - 18} Z`;
  const pct = percentile(value);
  const delta = from != null ? value - from : null;

  return (
    <div>
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[46px] leading-none font-medium tracking-[-0.02em] text-ink tabular-nums">{value}</p>
          <p className="mt-1 text-sm text-muted">{scoreTier(value)}</p>
        </div>
        <div className="pb-1 text-right">
          <p className="text-[15px] font-medium text-red">Better than ~{ordinal(pct)} percentile</p>
          {delta !== null && delta !== 0 && (
            <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${delta > 0 ? "bg-ok-50 text-ok" : "bg-surface-2 text-muted"}`}>
              {delta > 0 ? "+" : ""}{delta} from where you are
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-3 rounded-2xl bg-surface p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={px} height={H} />
            </clipPath>
            <linearGradient id="curve-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--red)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--red)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={area} fill="var(--surface-2)" />
          <path d={area} fill="url(#curve-fill)" clipPath={`url(#${clipId})`} />
          <path d={line} fill="none" stroke="var(--red)" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
          {from != null && (
            <g>
              <line x1={x(from)} x2={x(from)} y1={y(from)} y2={H - 18} stroke="var(--faint)" strokeWidth="2" strokeDasharray="3 4" />
              <circle cx={x(from)} cy={y(from)} r="5" fill="#fff" stroke="var(--faint)" strokeWidth="2.5" />
              <text x={x(from)} y={y(from) - 11} textAnchor="middle" fontSize="11" fill="var(--muted)">you now</text>
            </g>
          )}
          <line x1={px} x2={px} y1={y(value)} y2={H - 18} stroke="var(--red)" strokeWidth="2.5" strokeDasharray="4 4" />
          <circle cx={px} cy={y(value)} r="7" fill="#fff" stroke="var(--red)" strokeWidth="4" />
        </svg>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Score"
          className="score-range mt-1"
          style={{ ["--track" as string]: `linear-gradient(to right, var(--red) ${((value - MIN) / (MAX - MIN)) * 100}%, var(--surface-2) 0)` }}
        />
        <div className="mt-0.5 flex justify-between px-0.5 text-xs text-faint tabular-nums"><span>{MIN}</span><span>{MAX}</span></div>
      </div>

      {presets && (
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-pressed={value === p}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium tabular-nums transition-colors ${value === p ? "border-red bg-red text-white" : "border-line-strong bg-white text-ink-2 hover:border-red-200 hover:bg-red-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
