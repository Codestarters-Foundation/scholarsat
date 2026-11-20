"use client";
import Link from "next/link";
import { SECTION_LABEL, TAXONOMY, type Section } from "@/lib/types";
export function practiceSet(counts: Record<string, number>, subject: Section, skill?: string) {
  const selected = skill || TAXONOMY[subject].flatMap(group => group.skills).find(name => counts[name]) || "";
  const n = Math.min(5, counts[selected] || 0);
  const query = new URLSearchParams({section:subject, skill:selected, limit:String(n)});
  return {subject, selected, n, href:"/practice/play?" + query.toString()};
}

export function PracticeSetPicker({counts, set, onChoose}: {
  counts: Record<string, number>;
  set: ReturnType<typeof practiceSet>;
  onChoose: (set: ReturnType<typeof practiceSet>) => void;
}) {
  const {subject, selected, n, href} = set;
  const groups = TAXONOMY[subject];
  return (
    <div className="set-picker">
      <div className="subject-choices">
        {(["math", "rw"] as const).map((s) => (
          <button
            key={s}
            aria-pressed={subject === s}
            onClick={() => onChoose(practiceSet(counts,s))}
          >
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>
      <label>
        Choose a skill
        <select value={selected} onChange={e => onChoose(practiceSet(counts,subject,e.target.value))}>
          {groups.map((group) => (
            <optgroup key={group.domain} label={group.domain}>
              {group.skills
                .filter((name) => counts[name])
                .map((name) => (
                  <option key={name}>{name}</option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      {n > 0 && (
        <Link href={href} className="set-start">
          Practice {n} questions →
        </Link>
      )}
    </div>
  );
}
