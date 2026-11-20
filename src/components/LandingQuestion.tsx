"use client";

import { quietPlayback } from "./landing-navigation";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type FeaturedQuestion = { passage: string; stem: string; choices: string[]; answer: string; explanation: string };
const wrongReading: Record<string, string> = {
  "Furthermore,": "This would add another point. Read the second sentence again. It names one culture that used the Moon.",
  "Finally,": "This would finish a sequence. The passage moves from several cultures to one specific culture.",
  "By contrast,": "This would set up a difference. The Babylonian calendar fits the pattern in the first sentence.",
};

function emphasize(text: string, phrase: string) {
  const at = text.indexOf(phrase);
  return at === -1 ? text : <>{text.slice(0,at)}<mark>{phrase}</mark>{text.slice(at + phrase.length)}</>;
}

export function LandingQuestion({ question, pick, setPick }: {
  question: FeaturedQuestion; pick: number | null; setPick: (index: number) => void;
}) {
  const [preview, setPreview] = useState<number | null>(null);
  const typesetWord = useRef<HTMLSpanElement>(null);
  const source = useRef<DOMRect | null>(null);
  useLayoutEffect(() => {
    const word = typesetWord.current, from = source.current;
    source.current = null;
    if (!word || !from || quietPlayback(word)) return;
    const to = word.getBoundingClientRect();
    const zoom = to.width / parseFloat(getComputedStyle(word).width);
    const flight = word.animate([
      { transform: `translate(${(from.left-to.left)/zoom}px,${(from.top-to.top)/zoom}px) scale(${from.width/to.width})` },
      { transform: "none" }
    ], {duration: 290, easing: "cubic-bezier(.21,.8,.2,1)"});
    return () => flight.cancel();
  }, [pick]);
  const correct = pick !== null && "ABCD"[pick] === question.answer;
  const shown = correct ? pick : preview ?? pick;
  const [first, second] = question.passage.split(/\s*_{4,}\s*/);
  return (
    <div className="passage-copy" data-solved={correct}>
      <h2 id="passage-title" tabIndex={-1}>Which word fits?</h2>
      <p className="reading-text">
        <span className="claim">{emphasize(first,"Several ancient cultures")}</span>{" "}
        <span className="insertion" data-filled={shown !== null}>
          {shown === null ? <><span aria-hidden="true">_____</span><span className="sr-only">blank</span></> : <span className="typeset-word" ref={typesetWord}>{question.choices[shown]}</span>}
        </span>{" "}<span className="example">{emphasize(second,"Babylonian astronomers")}</span>
      </p>
      <fieldset className="word-bank">
        <legend>{question.stem}</legend>
        <div>{question.choices.map((word,i) => (
          <button type="button" key={word} aria-pressed={pick === i} aria-disabled={correct}
            data-state={pick === i ? correct ? "correct" : "retry" : undefined}
            onPointerEnter={e => { if (e.pointerType === "mouse" && !correct) setPreview(i); }}
            onPointerLeave={() => setPreview(null)} onFocus={() => { if (!correct) setPreview(i); }} onBlur={() => setPreview(null)}
            onClick={e => {
              if (correct) return;
              source.current = e.currentTarget.querySelector(".choice-word")!.getBoundingClientRect();
              setPick(i);
              setPreview(null);
            }}>
            <span className="choice-key" aria-hidden="true">{pick === i ? correct ? "✓" : "↺" : "ABCD"[i]}</span><span className="choice-word">{word}</span>
          </button>
        ))}</div>
      </fieldset>
      <div aria-live="polite" aria-atomic="true" className="reading-note">
        {pick !== null && <div key={pick}>
          <strong>{correct ? "Exactly." : "Try another transition."}</strong>{" "}
          {correct ? question.explanation : wrongReading[question.choices[pick]]}
        </div>}
      </div>
      {correct && <Link className="ink-link" href="/practice/play?section=rw&skill=Transitions&limit=5">Practice five more transitions <span aria-hidden="true">→</span></Link>}
    </div>
  );
}
