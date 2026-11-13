"use client";
import { useMemo, useState } from "react";
import type { Vocab } from "@/data/vocab";
import { Button, Progress } from "./ui";
import { Owl } from "./Owl";
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
              className={`group relative grid min-h-[340px] w-full place-items-center overflow-hidden rounded-2xl border-2 p-8 text-center shadow-card transition-colors ${flipped ? "border-gold-100 bg-gold-50" : "border-line bg-white hover:border-red-200"}`}
              aria-label={flipped ? "Show word" : "Show definition"}
            >
              <span className="eyebrow absolute left-5 top-4 text-faint">{flipped ? "Definition" : "Word"}</span>
              <span className="absolute right-5 top-4 text-xs tabular-nums text-faint">{Math.min(i, deck.length - 1) + 1} / {deck.length}</span>
              {!flipped ? (
                <div key="front" className="animate-rise">
                  <p className="text-[46px] leading-tight font-medium tracking-[-0.02em]">{w.word}</p>
                  <p className="mt-2 text-sm italic text-muted">{w.pos}</p>
                  <p className="eyebrow mt-10 text-red">Tap to reveal</p>
                </div>
              ) : (
                <div key="back" className="max-w-lg animate-rise">
                  <p className="eyebrow text-gold-600">{w.word}</p>
                  <p className="mt-3 text-[24px] leading-snug font-medium">{w.def}</p>
                  <p className="mt-5 text-muted">&ldquo;{w.ex}&rdquo;</p>
                </div>
              )}
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => { setI(Math.max(0, i - 1)); setFlipped(false); }} disabled={i === 0}><IArrowL className="h-4 w-4" /> Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => mark(false)}><IRefresh className="h-4 w-4" /> Still learning</Button>
                <Button variant="success" onClick={() => mark(true)}><ICheck className="h-4 w-4" /> I know it</Button>
              </div>
              <Button variant="ghost" onClick={() => { setI(Math.min(deck.length - 1, i + 1)); setFlipped(false); }} disabled={i >= deck.length - 1}>Next <IArrowR className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="grid min-h-[340px] place-items-center rounded-2xl border-2 border-gold-100 bg-gold-50 p-8 text-center">
            <div className="flex flex-col items-center">
              <Owl size={96} mood="celebrate" />
              <p className="mt-4 text-[26px] font-medium">You know every word!</p>
              <Button className="mt-4" variant="secondary" onClick={() => { setMode("all"); setI(0); }}>Review all words</Button>
            </div>
          </div>
        )}
      </div>
      <aside className="h-fit overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="border-t-4 border-gold-700 bg-gold px-5 py-3 text-white"><p className="font-medium">Words mastered</p></div>
        <div className="p-5">
          <p className="text-[32px] leading-none font-medium tabular-nums">{known.size}<span className="text-lg text-muted"> / {words.length}</span></p>
          <div className="mt-3"><Progress value={known.size / words.length} tone="gold" /></div>
          <div className="mt-5 inline-flex w-full rounded-xl bg-surface-2 p-1">
            {(["learning", "all"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setI(0); setFlipped(false); }} aria-pressed={mode === m} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-white text-red shadow-card" : "text-muted hover:text-ink"}`}>
                {m === "learning" ? "Still learning" : "All words"}
              </button>
            ))}
          </div>
          {!signedIn && <p className="mt-4 text-xs text-muted">Log in to save which words you know.</p>}
        </div>
      </aside>
    </div>
  );
}
