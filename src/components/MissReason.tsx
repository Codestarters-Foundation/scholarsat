"use client";
import { useRef, useState } from "react";
import { MISS_REASONS, type MissReasonId } from "@/lib/miss-reasons";

/** After a wrong answer: one tap to say why. Optional, and tapping the same chip again clears it. */
export function MissReason({ qid }: { qid: string }) {
  const [picked, setPicked] = useState<MissReasonId | null>(null);
  const [note, setNote] = useState<"" | "saved" | "error">("");
  const seq = useRef(0);

  const pick = async (id: MissReasonId) => {
    const next = picked === id ? null : id;
    const mine = ++seq.current;
    const before = picked;
    setPicked(next);
    setNote("");
    try {
      const res = await fetch("/api/miss-reason", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: qid, reason: next }) });
      if (mine !== seq.current) return; // a newer tap is in flight
      if (res.ok) setNote(next ? "saved" : "");
      else {
        setPicked(before);
        setNote("error");
      }
    } catch {
      if (mine !== seq.current) return;
      setPicked(before);
      setNote("error");
    }
  };

  return (
    // The practice screen listens for Enter and the arrow keys on the whole window (check / next / back). Keys
    // pressed on these buttons belong to them, so they must not also move to the next question.
    <div role="group" aria-label="Why did you miss this question?" onKeyDown={(e) => e.stopPropagation()}>
      <p className="text-[13px] text-ink-2">
        Why did you miss it? <span className="text-faint">Optional. It helps your Review page show a pattern.</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MISS_REASONS.map((r) => {
          const on = picked === r.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              onClick={() => pick(r.id)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${on ? "border-red bg-red-50 font-medium text-red" : "border-line bg-bg text-ink-2 hover:bg-surface-2"}`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 min-h-[1.1rem] text-xs" role="status" aria-live="polite">
        {note === "saved" && <span className="text-muted">Saved. This question will come back in a day.</span>}
        {note === "error" && <span className="text-bad">Couldn&rsquo;t save that. Try again.</span>}
      </p>
    </div>
  );
}
