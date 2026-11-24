"use client";
import { useId, useState } from "react";
import { AiConnect } from "./AiConnect";
import { ICheck } from "./icons";
import { useAiConfig } from "@/lib/use-ai-config";

/**
 * Onboarding step: "Want an AI study helper?" Yes opens the guided key setup right here; Not now just
 * moves on. Nothing here blocks the Continue button, and it works for guests too (the key stays in the browser).
 */
export function AiOnboardingStep() {
  const cfg = useAiConfig();
  const uid = useId();
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  if (cfg === undefined) return <div className="min-h-[240px]" aria-hidden="true" />;

  return (
    <div
      className="grid gap-5"
      // Enter inside this step is for its own fields and buttons, not "Continue".
      onKeyDown={(e) => {
        if (e.key === "Enter") e.stopPropagation();
      }}
    >
      <ul className="grid gap-2 text-[15px] text-ink-2">
        <li className="flex gap-2.5"><ICheck className="mt-1 h-4 w-4 shrink-0 text-ok" /> Explains, in plain words, why you missed a question</li>
        <li className="flex gap-2.5"><ICheck className="mt-1 h-4 w-4 shrink-0 text-ok" /> Gives you a memory trick for hard vocabulary words</li>
        <li className="flex gap-2.5"><ICheck className="mt-1 h-4 w-4 shrink-0 text-ok" /> Only runs when you tap its button. ScholarSAT works fully without it.</li>
      </ul>

      {cfg ? (
        <AiConnect />
      ) : (
        <>
          <fieldset className="grid gap-2.5 sm:grid-cols-2">
            <legend className="sr-only">Do you want AI help?</legend>
            {([
              ["yes", "Yes, set it up", "Takes about two minutes. Free options available."],
              ["no", "Not now", "You can turn it on later in Settings."],
            ] as const).map(([v, title, sub]) => (
              <label
                key={v}
                className="flex cursor-pointer flex-col gap-0.5 rounded-xl border-2 border-line bg-bg p-3.5 transition-colors hover:border-red-200 has-[:checked]:border-red has-[:checked]:bg-red-50 focus-within:ring-2 focus-within:ring-red/30"
              >
                <input type="radio" name={`${uid}-ai`} value={v} checked={choice === v} onChange={() => setChoice(v)} className="sr-only" />
                <span className="text-[15px] font-medium text-ink">{title}</span>
                <span className="text-xs text-muted">{sub}</span>
              </label>
            ))}
          </fieldset>
          {choice === "yes" && <AiConnect />}
          {choice === "no" && <p className="text-sm text-muted">No problem. Find it any time under Settings, then AI study helper.</p>}
        </>
      )}
    </div>
  );
}
