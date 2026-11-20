"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { IBook, IHome, IRefresh } from "./icons";

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    src: "/landing/dashboard.webp",
    alt: "A student's dashboard: a 4-day streak, a daily goal at 14 of 18 questions, a predicted score of 1270 and accuracy by skill",
    Icon: IHome,
  },
  {
    id: "bank",
    label: "Question bank",
    src: "/landing/bank.webp",
    alt: "The question bank, with an accuracy ring and a practice button on every math skill",
    Icon: IBook,
  },
  {
    id: "review",
    label: "Mistake review",
    src: "/landing/review.webp",
    alt: "The review page listing 45 missed questions by skill and difficulty, each ready to retry",
    Icon: IRefresh,
  },
] as const;

/** Tabbed views of the real study tools. */
export function LandingShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  function moveTab(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % TABS.length
        : event.key === "ArrowLeft"
          ? (index + TABS.length - 1) % TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? TABS.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="app-tour">
      <div role="tablist" aria-label="App screens" className="tour-tabs">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            ref={(el) => { tabs.current[i] = el; }}
            tabIndex={active === i ? 0 : -1}
            onKeyDown={(e) => moveTab(e, i)}
            id={`showcase-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls="showcase-panel"
            onClick={() => setActive(i)}
          >
            <t.Icon aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      <div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${tab.id}`} tabIndex={0}>
        <Image
          key={tab.id}
          src={tab.src}
          alt={tab.alt}
          width={2200}
          height={1375}
          sizes="(min-width: 800px) 60vw, 92vw"
        />
      </div>
    </div>
  );
}
