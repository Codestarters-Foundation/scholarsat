"use client";
import { IKey } from "./icons";
import { AiConnect } from "./AiConnect";

/** Settings page card. */
export function AiSettings() {
  return (
    <section
      id="ai"
      className="grid scroll-mt-24 gap-6 rounded-2xl border border-line bg-bg p-6 shadow-card transition-colors md:grid-cols-[260px_minmax(0,1fr)]"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-muted">
            <IKey className="h-5 w-5" />
          </span>
          <h2 className="text-[17px] font-medium text-ink">AI study helper</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Optional. Connect your own AI account to get explanations on practice questions and memory tricks for vocabulary. It can be free. ScholarSAT works fully without it.
        </p>
      </div>
      <AiConnect />
    </section>
  );
}
