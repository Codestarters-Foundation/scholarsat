"use client";
import { useSyncExternalStore } from "react";

/**
 * Which question has its tutor open. A tiny shared store so the "Teach me" button (inside the result card)
 * and the tutor tray (below the question) can talk without PracticePlayer holding any new state.
 * PracticePlayer clears the open lesson when the student leaves the question.
 */
let openFor: string | null = null;
const subs = new Set<() => void>();

export function setTutorOpen(qid: string | null) {
  if (openFor === qid) return;
  openFor = qid;
  subs.forEach((f) => f());
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

export function useTutorOpenFor(): string | null {
  return useSyncExternalStore(subscribe, () => openFor, () => null);
}
