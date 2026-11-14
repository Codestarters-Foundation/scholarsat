"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "system" | "light" | "dark";
export type AccentColor = "red" | "gold" | "blue" | "green" | "purple" | "rose";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accent: AccentColor;
  setAccent: (a: AccentColor) => void;
  compact: boolean;
  setCompact: (c: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (r: boolean) => void;
  saveAppearance: (opts: { theme?: Theme; accent?: AccentColor; compact?: boolean; reduceMotion?: boolean }) => Promise<boolean>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({
  children,
  initialTheme = "system",
  initialAccent = "red",
  initialCompact = false,
  initialReduceMotion = false,
  signedIn = false,
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
  initialAccent?: AccentColor;
  initialCompact?: boolean;
  initialReduceMotion?: boolean;
  signedIn?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [accent, setAccentState] = useState<AccentColor>(initialAccent);
  const [compact, setCompactState] = useState<boolean>(initialCompact);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(initialReduceMotion);

  // Apply visual classes to HTML element
  const applySettings = useCallback((t: Theme, a: AccentColor, c: boolean, r: boolean) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.dataset.theme = t;
    root.dataset.accent = a;

    const isDark =
      t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (c) {
      root.classList.add("compact");
    } else {
      root.classList.remove("compact");
    }

    if (r) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, []);

  // Initialize from localStorage or server props on mount
  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem("ss_theme") as Theme) || initialTheme;
      const storedAccent = (localStorage.getItem("ss_accent") as AccentColor) || initialAccent;
      const storedCompact =
        localStorage.getItem("ss_compact") !== null
          ? localStorage.getItem("ss_compact") === "true"
          : initialCompact;
      const storedReduceMotion =
        localStorage.getItem("ss_reduce_motion") !== null
          ? localStorage.getItem("ss_reduce_motion") === "true"
          : initialReduceMotion;

      setThemeState(storedTheme);
      setAccentState(storedAccent);
      setCompactState(storedCompact);
      setReduceMotionState(storedReduceMotion);

      applySettings(storedTheme, storedAccent, storedCompact, storedReduceMotion);
    } catch {}
  }, [initialTheme, initialAccent, initialCompact, initialReduceMotion, applySettings]);

  // Listen for system color scheme changes when theme === 'system'
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applySettings("system", accent, compact, reduceMotion);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, accent, compact, reduceMotion, applySettings]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("ss_theme", t);
    } catch {}
    applySettings(t, accent, compact, reduceMotion);
    if (signedIn) {
      saveAppearance({ theme: t });
    }
  };

  const setAccent = (a: AccentColor) => {
    setAccentState(a);
    try {
      localStorage.setItem("ss_accent", a);
    } catch {}
    applySettings(theme, a, compact, reduceMotion);
    if (signedIn) {
      saveAppearance({ accent: a });
    }
  };

  const setCompact = (c: boolean) => {
    setCompactState(c);
    try {
      localStorage.setItem("ss_compact", String(c));
    } catch {}
    applySettings(theme, accent, c, reduceMotion);
    if (signedIn) {
      saveAppearance({ compact: c });
    }
  };

  const setReduceMotion = (r: boolean) => {
    setReduceMotionState(r);
    try {
      localStorage.setItem("ss_reduce_motion", String(r));
    } catch {}
    applySettings(theme, accent, compact, r);
    if (signedIn) {
      saveAppearance({ reduceMotion: r });
    }
  };

  const saveAppearance = async (opts: {
    theme?: Theme;
    accent?: AccentColor;
    compact?: boolean;
    reduceMotion?: boolean;
  }) => {
    const t = opts.theme ?? theme;
    const a = opts.accent ?? accent;
    const c = opts.compact !== undefined ? opts.compact : compact;
    const r = opts.reduceMotion !== undefined ? opts.reduceMotion : reduceMotion;

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "appearance",
          theme: t,
          accent_color: a,
          compact_mode: c ? 1 : 0,
          reduce_animations: r ? 1 : 0,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accent,
        setAccent,
        compact,
        setCompact,
        reduceMotion,
        setReduceMotion,
        saveAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
