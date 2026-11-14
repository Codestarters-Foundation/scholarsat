"use client";

import type { Vocab } from "@/data/vocab";
import { VocabStudy } from "./VocabStudy";

export function Flashcards({
  words,
  initialKnown,
  signedIn,
}: {
  words: Vocab[];
  initialKnown: string[];
  signedIn: boolean;
}) {
  return <VocabStudy words={words} initialKnown={initialKnown} signedIn={signedIn} />;
}
