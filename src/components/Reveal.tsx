"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type State = "idle" | "armed" | "in";

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen at load: leave it visible rather than hiding and replaying it.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setState("armed");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, state };
}

/**
 * Fades a block up as it scrolls into view. With `stagger`, the block itself stays put and each
 * child marked `.lp-stagger` (with a `--i` index) rises in turn. Styles live in landing.css.
 */
export function Reveal({ children, className = "", delay = 0, stagger = false }: { children: ReactNode; className?: string; delay?: number; stagger?: boolean }) {
  const { ref, state } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-armed={state !== "idle" ? "true" : undefined}
      data-in={state === "in" ? "true" : undefined}
      className={`${stagger ? "lp-group" : "lp-reveal"} ${className}`}
      style={delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/** A number that counts up the first time it scrolls into view. Renders the final value on the server. */
export function CountUp({ to, className = "" }: { to: number; className?: string }) {
  const { ref, state } = useInView<HTMLSpanElement>();
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (state === "armed") setValue(0);
    if (state !== "in") return;
    const start = performance.now();
    const duration = 1500;
    let raf = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out exponential never quite reaches 1, so land exactly on the target at the end.
      setValue(t >= 1 ? to : Math.round(to * (1 - Math.pow(2, -10 * t))));
      if (t < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [state, to]);

  return (
    <span ref={ref} className={className} aria-label={to.toLocaleString()}>
      <span aria-hidden="true">{value.toLocaleString()}</span>
    </span>
  );
}
