"use client";

import Image from "next/image";
import { useState } from "react";
import { IBook, IHome, IRefresh } from "./icons";

const TABS = [
  { id: "dashboard", label: "Dashboard", path: "dashboard", src: "/landing/dashboard.webp", alt: "A student's dashboard: a 4-day streak, a daily goal at 14 of 18 questions, a predicted score of 1270 and accuracy by skill", Icon: IHome },
  { id: "bank", label: "Question bank", path: "practice", src: "/landing/bank.webp", alt: "The question bank, with an accuracy ring and a practice button on every math skill", Icon: IBook },
  { id: "review", label: "Mistake review", path: "review", src: "/landing/review.webp", alt: "The review page listing 45 missed questions by skill and difficulty, each ready to retry", Icon: IRefresh },
] as const;

/** Tabbed screenshots of the real app, framed like a browser window. */
export function LandingShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-red text-white">
      <div className="pattern-grid pointer-events-none absolute inset-0 text-white/[0.07]" />
      <div className="relative px-4 pt-5 sm:px-10 sm:pt-8">
        <div role="tablist" aria-label="App screens" className="flex gap-1.5 overflow-x-auto scroll-thin pb-1">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`showcase-tab-${t.id}`}
              aria-selected={i === active}
              aria-controls="showcase-panel"
              onClick={() => setActive(i)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors ${
                i === active ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <t.Icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${tab.id}`} className="mt-5 overflow-hidden rounded-t-xl border border-b-0 border-black/20 bg-white shadow-[0_-8px_60px_rgb(0_0_0/0.28)] sm:mt-7">
          <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            </span>
            <span className="mx-auto w-full max-w-xs truncate rounded-md bg-white px-3 py-1 text-center font-mono text-[12px] text-muted">scholarsat.com/{tab.path}</span>
            <span className="w-10" aria-hidden="true" />
          </div>
          <div className="relative aspect-[2040/1040] overflow-hidden">
            {TABS.map((t, i) => (
              <Image
                key={t.id}
                src={t.src}
                alt={i === active ? t.alt : ""}
                aria-hidden={i !== active}
                width={2200}
                height={1375}
                priority={i === 0}
                sizes="(min-width: 1200px) 1120px, 100vw"
                className={`absolute inset-x-0 top-0 h-auto w-full transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
