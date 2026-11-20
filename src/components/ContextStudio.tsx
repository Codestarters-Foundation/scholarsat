"use client";
import { useState } from "react";
import { lessons } from "@/data/context-lessons";
import { Tutor } from "./Tutor";

export function ContextStudio() {
  const [queue, setQueue] = useState(() => lessons.map((_, i) => i));
  const [stage, setStage] = useState<"word" | "clue">("word");
  const [pick, setPick] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const solved = lessons.length - queue.length;
  const lesson = lessons[queue[0]];
  if (!lesson)
    return (
      <section className="studio">
        <h2>Session complete.</h2>
        <p>You matched all {lessons.length} words to their evidence.</p>
        <button
          onClick={() => {
            setQueue(lessons.map((_, i) => i));
          }}
        >
          Practice again →
        </button>
      </section>
    );
  const choices = stage === "word" ? lesson.choices : lesson.clues;
  const answer = stage === "word" ? choices.indexOf(lesson.word) : lesson.clue;
  function advance() {
    if (stage === "word") setStage("clue");
    else {
      setQueue(missed ? [...queue.slice(1), queue[0]] : queue.slice(1));
      setStage("word");
      setMissed(false);
    }
    setPick(null);
  }
  return (
    <section className="studio">
      <div className="studio-meta">
        <span>Vocabulary studio</span>
        <span>
          {solved} / {lessons.length} complete
        </span>
      </div>
      <h2>{stage === "word" ? "Fill the gap." : "Find the evidence."}</h2>
      <blockquote>
        {lesson.passage.split("____")[0]}
        <strong>
          {stage === "word" && pick === null ? "____" : lesson.word}
        </strong>
        {lesson.passage.split("____")[1]}
      </blockquote>
      <p>
        {stage === "word"
          ? "Which word fits the passage?"
          : "Which phrase gives you the strongest clue?"}
      </p>
      <div className="studio-choices">
        {choices.map((choice, i) => (
          <button
            disabled={pick !== null}
            data-answer={pick !== null && i === answer}
            key={choice}
            onClick={() => {
              setPick(i);
              if (i !== answer) setMissed(true);
            }}
          >
            {choice}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {pick !== null && (
          <div className="studio-feedback">
            <b>{pick === answer ? "Correct." : "Review this one."}</b>{" "}
            {stage === "clue"
              ? lesson.why
              : "The word that fits is “" + lesson.word + "”."}{" "}
            {missed &&
              stage === "clue" &&
              "This passage will return for another try."}
            <div>
              <button onClick={advance}>
                {stage === "word" ? "Find the clue" : "Continue"} →
              </button>
            </div>
          </div>
        )}
      </div>
      {stage === "clue" && pick !== null && (
        <Tutor key={lesson.word} item={"word:" + lesson.word} />
      )}
    </section>
  );
}
