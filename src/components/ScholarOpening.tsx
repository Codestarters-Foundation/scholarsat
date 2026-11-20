"use client";

import { useLayoutEffect, useRef } from "react";

export function ScholarOpening() {
  const sheet = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const layer = sheet.current!;
    const target = document.querySelector<HTMLElement>(".cover-copy h1")!;
    const word = layer.querySelector<HTMLElement>(".opening-word")!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const flight = word.getAnimations()[0];
    if (!flight || location.hash || scrollY > 1 || flight.playState === "finished") {
      layer.hidden = true;
      return;
    }
    function aim() {
      const view = layer.getBoundingClientRect(), end = target.getBoundingClientRect();
      const zoom = view.width / layer.offsetWidth;
      const x = (end.left-view.left)/zoom - (layer.offsetWidth-word.offsetWidth)/2;
      const y = (end.top-view.top)/zoom - (layer.offsetHeight-word.offsetHeight)/2;
      const scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(getComputedStyle(word).fontSize);
      word.style.setProperty("--landing", `translate3d(${x}px,${y}px,0) scale(${scale})`);
    }
    aim();
    const lens = document.querySelector<HTMLElement>(".observation-lens");
    const arrival = lens?.animate([
      {translate:"15% 10%", rotate:"-13deg", scale:"1.28"},
      {translate:"0 0", rotate:"0deg", scale:"1"}
    ], {duration:950, delay:Math.max(0,1720-Number(flight.currentTime)), easing:"cubic-bezier(.19,.76,.19,1)", fill:"backwards"});
    document.fonts.ready.then(() => {
      if (!layer.hidden && Number(flight.currentTime) < 1720) aim();
    });
    target.style.opacity = "0";
    function finish() {
      layer.hidden = true;
      target.style.opacity = "";
    }
    flight.finished.then(finish, finish);
    const interrupt = () => { arrival?.cancel(); finish(); };
    const events = ["wheel","touchstart","pointerdown","keydown","scroll","resize"];
    events.forEach(name => window.addEventListener(name,interrupt,{passive:true,once:true}));
    preference.addEventListener("change",finish);
    return () => {
      events.forEach(name => window.removeEventListener(name,interrupt));
      preference.removeEventListener("change",finish);
      interrupt();
    };
  }, []);
  return <div ref={sheet} className="scholar-opening" aria-hidden="true">
    <div className="opening-paper"/><div className="opening-word"><span>ScholarSAT</span></div>
  </div>;
}
