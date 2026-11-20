"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { quietPlayback, turnTo } from "./landing-navigation";
import { StudyDesk, type StudyOptions } from "./StudyDesk";
import { LandingQuestion, type FeaturedQuestion } from "./LandingQuestion";

const phases = [
  { frame: "0061", day: "03", lit: "14.6%", phase: "Waxing crescent" },
  { frame: "0133", day: "06", lit: "44.5%", phase: "Near first quarter" },
  { frame: "0217", day: "10", lit: "81.7%", phase: "Waxing gibbous" },
  { frame: "0301", day: "13", lit: "99.6%", phase: "Near full moon" },
];

// NASA SVS 5415, sampled every twelve hours starting at noon UTC on January 3.
const illumination = [14.57,18.72,23.28,28.21,33.43,38.87,44.47,50.16,55.84,61.45,66.92,72.16,77.11,81.69,85.86,89.54,92.71,95.32,97.34,98.77,99.6];
const clamp = (n: number) => Math.max(0, Math.min(1,n));

export function LandingStudio({question, study}: { question: FeaturedQuestion; study: StudyOptions }) {
  const [pick,setPick] = useState<number | null>(null);
  const story = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = story.current!;
    const cover = root.querySelector<HTMLElement>(".atlas-cover")!;
    const stage = root.querySelector<HTMLElement>(".atlas-stage")!;
    const scrub = root.querySelector<HTMLInputElement>(".phase-scrub")!;
    const readout = root.querySelector<HTMLOutputElement>(".phase-readout")!;
    const sprites = Array.from(root.querySelectorAll<HTMLElement>(".lunar-frame"));
    const origins = Array.from(root.querySelectorAll<HTMLElement>(".exposure-origin"));
    const plates = origins.map(origin => origin.querySelector<HTMLElement>("figure")!);
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".archive-slot"));
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let distances: {x: number; y: number; scale: number}[] = [];
    let coverTop = 0;
    let lastProgress = -1;
    let lastTile = -1;
    let hold = 0;
    let stageHeight = 1;
    let lastPosition = -1;
    let lastIndex = -1;
    let manualIndex = 0;
    function showTime(position: number) {
      if (position === lastPosition) return;
      lastPosition = position;
      const sample = position * (illumination.length - 1);
      const index = Math.min(20, Math.floor(sample));
      const nearest = Math.round(sample);
      if (index !== lastTile) sprites.forEach((sprite, i) => {
        const tile = Math.min(20, index + i);
        sprite.style.backgroundPosition = `${tile % 5 * 25}% ${Math.floor(tile / 5) * 25}%`;
      });
      lastTile = index;
      sprites[1].style.opacity = String(sample - index);
      stage.style.setProperty("--observation", String(position));
      stage.style.setProperty("--focus", String(Math.sin(Math.PI * position)));
      if (nearest === lastIndex) return;
      lastIndex = nearest;
      const day = String(3 + Math.floor((nearest + 1) / 2)).padStart(2, "0");
      const reading = `${day} Jan · ${nearest % 2 ? "00" : "12"}h UTC · ${illumination[nearest].toFixed(1)}% lit`;
      readout.value = reading;
      scrub.value = String(nearest);
      scrub.setAttribute("aria-valuetext", reading);
    }
    function draw() {
      frame = 0;
      const offset = scrollY - coverTop;
      const travel = Math.max(1, stageHeight * .88);
      const progress = clamp((offset - hold) / travel);
      const still = quietPlayback(root, motion);
      const observation = still || !hold ? manualIndex / 20 : clamp(offset / hold);
      const t = progress * progress * (3 - 2 * progress);
      showTime(observation);
      if (lastProgress === t) return;
      lastProgress = t;
      root.dataset.motion = still ? "still" : "on";
      root.style.setProperty("--progress", String(still ? 0 : t));
      plates.forEach((plate,i) => {
        const { x, y, scale } = distances[i];
        const cue = clamp((progress - i * .045) / .865);
        const step = cue * cue * (3 - 2 * cue);
        const arc = Math.sin(step * Math.PI);
        plate.style.transform = still ? "" : `translate3d(${x*step}px,${y*step - arc*stageHeight*.11}px,0) scale(${1+(scale-1)*step})`;
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    function measure() {
      root.closest(".lunar-home")!.toggleAttribute("data-play-motion", !quietPlayback(root,motion));
      const stageRect = stage.getBoundingClientRect(), coverRect = cover.getBoundingClientRect();
      const navHeight = root.closest(".lunar-home")!.querySelector(".landing-header")!.getBoundingClientRect().height;
      coverTop = coverRect.top + scrollY - navHeight;
      lastProgress = -1;
      stageHeight = stageRect.height;
      hold = Math.max(0, coverRect.height - stageHeight);
      const remainingHold = coverRect.bottom - stageRect.bottom;
      distances = origins.map((origin,i) => {
        const a = origin.getBoundingClientRect(), b = targets[i].getBoundingClientRect();
        // The app zooms its root on large screens. DOM rects include that zoom, CSS translations do not.
        const zoom = a.width / parseFloat(getComputedStyle(origin).width);
        return { x: (b.left-a.left)/zoom, y: (b.top-a.top-remainingHold)/zoom, scale: b.width/a.width };
      });
      schedule();
    }
    function seek() {
      manualIndex = Number(scrub.value);
      if (hold) window.scrollTo({ top: coverTop + hold * manualIndex / 20, behavior: "instant" });
      schedule();
    }
    scrub.addEventListener("input", seek);
    measure();
    const observer = new ResizeObserver(measure);
    [cover, stage, ...origins, ...targets, root].forEach(el => observer.observe(el));
    const preferences = new MutationObserver(measure);
    preferences.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    addEventListener("scroll",schedule,{ passive:true });
    motion.addEventListener("change",measure);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); preferences.disconnect(); removeEventListener("scroll",schedule); motion.removeEventListener("change",measure); scrub.removeEventListener("input",seek); };
  }, []);
  return (<>
    <article className="atlas measure" ref={story}>
      <header className="atlas-cover"><div className="atlas-stage">
        <div className="cover-copy">
          <h1>ScholarSAT</h1>
          <p className="hero-product">Free digital SAT practice</p>
          <div className="opening-actions">
            <Link className="read-action" href="/#passage" onNavigate={event => turnTo("passage",event)}><span className="action-arrow" aria-hidden="true">↓</span>Try reading &amp; writing</Link>
            <Link className="math-entry" href="/practice/play?section=math&limit=5">Practice math <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="exposure-field" aria-hidden="true">
          {phases.map(p => <div className="exposure-origin" key={p.frame}><figure>
            <Image unoptimized className="moon-disc" src={`/landing/lunar/${p.frame}.webp`} alt="" width={500} height={500} loading="eager" draggable="false" />
            {p === phases[3] && <div className="observation-lens">
              <div className="lunar-frame" /><div className="lunar-frame" />
              <div className="limb-scale"><i /></div>
            </div>}
          </figure>{p !== phases[3] && <span className="exposure-date">{p.day} Jan <b>/ {p.lit}</b></span>}</div>)}
        </div>
        <div className="plate-index">
          <label htmlFor="lunar-time">Explore ten nights</label>
          <input className="phase-scrub" id="lunar-time" type="range" min="0" max="20" defaultValue="0" aria-valuetext="03 Jan · 12h UTC · 14.6% lit" />
          <output htmlFor="lunar-time" className="phase-readout" aria-live="off">03 Jan · 12h UTC · 14.6% lit</output>
        </div>
      </div>
      </header>
      <section id="passage" className="reading-spread" aria-labelledby="passage-title">
        <figure className="lunar-archive" aria-label="Four observations of the waxing Moon, from crescent to nearly full">
          <div className="archive-strip">{phases.map(p => <div key={p.frame}>
            <div className="archive-slot"><Image unoptimized src={`/landing/lunar/${p.frame}.webp`} alt={p.phase} width={120} height={120} /></div>
            <span>Jan {p.day}</span>
            <div className="archive-meter" aria-label={p.lit + " illuminated"}><i style={{width:p.lit}} /></div>
          </div>)}</div>
          <figcaption>Moon phase sequence, January 2025.<br /><a href="https://svs.gsfc.nasa.gov/5415/">NASA Goddard / Ernie Wright ↗</a></figcaption>
        </figure>
        <LandingQuestion question={question} pick={pick} setPick={setPick} />
      </section>
    </article>
    <StudyDesk {...study} response={pick === null ? undefined : question.choices[pick]}
      solved={pick !== null && "ABCD"[pick] === question.answer} />
  </>);
}
