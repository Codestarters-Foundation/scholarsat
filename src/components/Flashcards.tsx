"use client";
import { useMemo, useState } from "react";
import type { Vocab } from "@/data/vocab";
import { Button, Progress } from "./ui";
import { IArrowL, IArrowR, ICheck, IRefresh } from "./icons";

export function Flashcards({ words, initialKnown, signedIn }: { words: Vocab[]; initialKnown: string[]; signedIn: boolean }) {
  const [known, setKnown] = useState(new Set(initialKnown));
  const [mode, setMode] = useState<"learning" | "all">("learning");
  const deck = useMemo(() => (mode === "learning" ? words.filter((w) => !known.has(w.word)) : words), [mode, words, known]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const w = deck[Math.min(i, deck.length - 1)];

  const mark = async (isKnown: boolean) => {
    if (!w) return;
    const n = new Set(known);
    if (isKnown) n.add(w.word);
    else n.delete(w.word);
    setKnown(n);
    setFlipped(false);
    if (mode === "all" || !isKnown) setI((x) => Math.min(x + 1, deck.length - 1));
    if (signedIn) fetch("/api/vocab", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ word: w.word, known: isKnown }) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        {w ? (
          <>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="group relative grid min-h-[320px] w-full place-items-center rounded-3xl border border-line bg-white p-8 text-center shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-red/30"
              aria-label={flipped ? "Show word" : "Show definition"}
            >
              {!flipped ? (
                <div>
                  <p className="font-display text-5xl font-semibold tracking-tight">{w.word}</p>
                  <p className="mt-3 text-sm italic text-muted">{w.pos}</p>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-gold-600">Tap to reveal</p>
                </div>
              ) : (
                <div className="max-w-lg">
                  <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">{w.word}</p>
                  <p className="mt-3 font-display text-2xl font-semibold">{w.def}</p>
                  <p className="mt-5 text-muted">&ldquo;{w.ex}&rdquo;</p>
                </div>
              )}
            </button>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => { setI(Math.max(0, i - 1)); setFlipped(false); }} disabled={i === 0}><IArrowL className="h-4 w-4" /> Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => mark(false)}><IRefresh className="h-4 w-4" /> Still learning</Button>
                <Button onClick={() => mark(true)}><ICheck className="h-4 w-4" /> I know it</Button>
              </div>
              <Button variant="ghost" onClick={() => { setI(Math.min(deck.length - 1, i + 1)); setFlipped(false); }} disabled={i >= deck.length - 1}>Next <IArrowR className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="grid min-h-[320px] place-items-center rounded-3xl border border-gold-100 bg-gold-50 p-8 text-center">
            <div>
              <p className="font-display text-3xl font-semibold">You know every word!</p>
              <Button className="mt-4" variant="secondary" onClick={() => { setMode("all"); setI(0); }}>Review all words</Button>
            </div>
          </div>
        )}
      </div>
      <aside className="h-fit rounded-2xl border border-line bg-white p-5">
        <p className="text-sm text-muted">Words mastered</p>
        <p className="font-display text-3xl font-semibold">{known.size}<span className="text-lg text-muted"> / {words.length}</span></p>
        <div className="mt-3"><Progress value={known.size / words.length} tone="gold" /></div>
        <div className="mt-5 inline-flex w-full rounded-xl bg-surface p-1">
          {(["learning", "all"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setI(0); setFlipped(false); }} aria-pressed={mode === m} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === m ? "bg-white text-red shadow-sm" : "text-muted"}`}>
              {m === "learning" ? "Still learning" : "All words"}
            </button>
          ))}
        </div>
        {!signedIn && <p className="mt-4 text-xs text-muted">Log in to save which words you know.</p>}
        {w && <p className="mt-4 text-xs text-muted">Card {Math.min(i, deck.length - 1) + 1} of {deck.length}</p>}
      </aside>
    </div>
  );
}
