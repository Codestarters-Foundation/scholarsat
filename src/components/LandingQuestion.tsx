"use client";

import Link from "next/link";
import { useState } from "react";
import { Owl } from "./Owl";
import { btn } from "./ui";
import { IArrowR, ICheckCircle, IXCircle } from "./icons";

export type LandingItem = {
  id: string;
  /** e.g. "Math, Algebra" */
  topic: string;
  difficulty: string;
  passageHtml?: string;
  stemHtml: string;
  choicesHtml: string[];
  /** "A" | "B" | "C" | "D" */
  answer: string;
  explanationHtml: string;
};

const LETTERS = "ABCD";

/** A real question from the bank that visitors can answer on the landing page. The owl reacts. */
export function LandingQuestion({ items }: { items: LandingItem[] }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);

  const q = items[idx];
  const answered = picked !== null;
  const correct = picked === q.answer;
  const last = idx === items.length - 1;

  function pick(letter: string) {
    if (answered) return;
    setPicked(letter);
    if (letter === q.answer) setRight((n) => n + 1);
  }

  function next() {
    setIdx((i) => i + 1);
    setPicked(null);
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute bottom-full right-8 -mb-1.5">
        <Owl key={`${q.id}-${picked ?? "idle"}`} size={76} mood={!answered ? "idle" : correct ? "celebrate" : "sad"} />
      </div>

      <section aria-label="Sample question" className="rounded-2xl border border-line bg-white p-6 shadow-pop sm:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[15px] font-medium text-ink">{q.topic}</p>
          <p className="shrink-0 text-[13px] text-muted tabular-nums">
            Question {idx + 1} of {items.length}
          </p>
        </div>
        <p className="mt-0.5 text-[13px] text-muted">{q.difficulty} difficulty</p>

        <div className="mt-5 space-y-3 text-[16px] text-ink">
          {q.passageHtml && <div className="qtext" dangerouslySetInnerHTML={{ __html: q.passageHtml }} />}
          <div className="qtext font-medium" dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
        </div>

        <div className="mt-5 grid gap-2.5" role="group" aria-label="Answer choices">
          {q.choicesHtml.map((html, i) => {
            const letter = LETTERS[i];
            const isAnswer = answered && letter === q.answer;
            const isWrongPick = answered && letter === picked && !correct;
            const tone = isAnswer
              ? "border-ok bg-ok-50"
              : isWrongPick
                ? "border-bad bg-bad-50"
                : answered
                  ? "border-line opacity-60"
                  : "border-line hover:border-ink/40 active:bg-surface";
            const dot = isAnswer ? "border-ok bg-ok text-white" : isWrongPick ? "border-bad bg-bad text-white" : "border-line-strong text-ink";
            return (
              <button
                key={letter}
                type="button"
                onClick={() => pick(letter)}
                aria-disabled={answered}
                aria-pressed={letter === picked}
                className={`flex min-h-[52px] w-full items-center gap-3.5 rounded-xl border-2 px-3.5 py-2.5 text-left text-[15px] transition-colors ${tone} ${answered ? "cursor-default" : ""}`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[13px] font-medium ${dot}`}>{letter}</span>
                <span className="qtext min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: html }} />
                {isAnswer && <ICheckCircle className="h-5 w-5 shrink-0 text-ok" />}
                {isWrongPick && <IXCircle className="h-5 w-5 shrink-0 text-bad" />}
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {answered && (
            <div className="mt-5 animate-rise border-t border-line pt-5">
              <p className={`text-[15px] font-medium ${correct ? "text-ok" : "text-bad"}`}>
                {correct ? "Correct." : `Not quite. The answer is ${q.answer}.`}
              </p>
              <div className="qtext mt-1.5 text-[15px] text-ink-2" dangerouslySetInnerHTML={{ __html: q.explanationHtml }} />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {last ? (
                  <>
                    <p className="text-[14px] text-muted">
                      You got {right} of {items.length}.
                    </p>
                    <Link href="/practice" className={btn("primary", "md")}>
                      Keep going in the question bank <IArrowR className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <button type="button" onClick={next} className={`${btn("dark", "md")} ml-auto`}>
                    Next question <IArrowR className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
