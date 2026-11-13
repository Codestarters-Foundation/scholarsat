"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TAXONOMY, SECTION_LABEL, type Section, type Difficulty } from "@/lib/types";
import { Button } from "./ui";

type Counts = Record<string, Record<Difficulty, number>>; // by skill

export function PracticeFilters({ counts, signedIn, statusCounts }: { counts: Counts; signedIn: boolean; statusCounts?: { incorrect: number; bookmarks: number } }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("math");
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [diff, setDiff] = useState<Set<Difficulty>>(new Set(["E", "M", "H"]));
  const [status, setStatus] = useState<"all" | "unanswered" | "incorrect" | "bookmarked">("all");
  const [limit, setLimit] = useState(20);

  const available = useMemo(() => {
    const sel = skills.size ? [...skills] : TAXONOMY[section].flatMap((d) => d.skills);
    return sel.reduce((n, k) => n + [...diff].reduce((a, d) => a + (counts[k]?.[d] ?? 0), 0), 0);
  }, [skills, diff, section, counts]);

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const start = () => {
    const p = new URLSearchParams({ section, status, limit: String(limit) });
    if (skills.size) p.set("skills", [...skills].join("|"));
    if (diff.size < 3) p.set("difficulty", [...diff].join(""));
    router.push(`/practice/play?${p}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="inline-flex rounded-xl bg-surface p-1" role="tablist" aria-label="Section">
          {(["math", "rw"] as Section[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={section === s}
              onClick={() => { setSection(s); setSkills(new Set()); }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${section === s ? "bg-white text-red shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {SECTION_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6">
          {TAXONOMY[section].map((d) => {
            const allOn = d.skills.every((k) => skills.has(k));
            return (
              <fieldset key={d.domain}>
                <div className="mb-2 flex items-center justify-between">
                  <legend className="font-display text-lg font-semibold">{d.domain}</legend>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red hover:underline"
                    onClick={() => {
                      const n = new Set(skills);
                      d.skills.forEach((k) => (allOn ? n.delete(k) : n.add(k)));
                      setSkills(n);
                    }}
                  >
                    {allOn ? "Clear" : "Select all"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {d.skills.map((k) => {
                    const n = (["E", "M", "H"] as Difficulty[]).reduce((a, x) => a + (counts[k]?.[x] ?? 0), 0);
                    const on = skills.has(k);
                    return (
                      <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${on ? "border-red bg-red-50" : "border-line hover:border-ink/25"}`}>
                        <input type="checkbox" checked={on} onChange={() => setSkills(toggle(skills, k))} className="mt-0.5 h-4 w-4 accent-[var(--red)]" />
                        <span className="min-w-0 flex-1">{k}</span>
                        <span className="tabular-nums text-xs text-muted">{n}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-lg font-semibold">Session settings</h2>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold">Difficulty</legend>
          <div className="flex gap-2">
            {([["E", "Easy"], ["M", "Medium"], ["H", "Hard"]] as [Difficulty, string][]).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={diff.has(k)} onClick={() => setDiff(toggle(diff, k))} className={`flex-1 rounded-lg border px-2 py-2 text-sm font-medium ${diff.has(k) ? "border-red bg-red-50 text-red" : "border-line text-muted"}`}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold">Questions</legend>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} disabled={!signedIn} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm disabled:opacity-60">
            <option value="all">All questions</option>
            <option value="unanswered">Not yet answered</option>
            <option value="incorrect">Previously missed{statusCounts ? ` (${statusCounts.incorrect})` : ""}</option>
            <option value="bookmarked">Saved{statusCounts ? ` (${statusCounts.bookmarks})` : ""}</option>
          </select>
          {!signedIn && <p className="mt-1.5 text-xs text-muted">Log in to filter by your history.</p>}
        </fieldset>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold">Session length</legend>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 40, 0].map((n) => (
              <button key={n} type="button" aria-pressed={limit === n} onClick={() => setLimit(n)} className={`rounded-lg border px-2 py-2 text-sm font-medium ${limit === n ? "border-red bg-red-50 text-red" : "border-line text-muted"}`}>
                {n || "All"}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-5 text-sm text-muted"><span className="font-semibold text-ink">{available.toLocaleString()}</span> questions match{skills.size ? "" : ` across all ${SECTION_LABEL[section]} skills`}.</p>
        <Button className="mt-4 w-full" onClick={start} disabled={!diff.size || !available}>Start practice</Button>
      </aside>
    </div>
  );
}
