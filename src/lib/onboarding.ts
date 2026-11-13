/** Shared (client + server) onboarding helpers: score math, test dates, and the study plan. */
import { TAXONOMY, type Section } from "./types";

export type OnboardingAnswers = {
  name: string;
  /** null = hasn't taken the SAT yet */
  currentScore: number | null;
  targetScore: number | null;
  gradClass: string | null;
  /** YYYY-MM-DD, or null if not sure yet */
  testDate: string | null;
  studyMinutes: number | null;
  /** domain names; empty = "not sure, help me find out" */
  focus: string[];
};

export const EMPTY_ANSWERS: OnboardingAnswers = {
  name: "",
  currentScore: null,
  targetScore: null,
  gradClass: null,
  testDate: null,
  studyMinutes: null,
  focus: [],
};

export const STORAGE_KEY = "ss_onboarding";

/* ---------- scores ---------- */

const MEAN = 1030;
const SD = 210;

function erf(x: number) {
  // Abramowitz-Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/** Approximate national percentile for a total score (normal model; for motivation, not for reporting). */
export function percentile(score: number) {
  const p = 0.5 * (1 + erf((score - MEAN) / (SD * Math.SQRT2)));
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}

/** Normal density scaled to 0..1 at the mean, for drawing the bell curve. */
export function curveHeight(score: number) {
  return Math.exp(-0.5 * ((score - MEAN) / SD) ** 2);
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function scoreTier(score: number) {
  if (score >= 1500) return "Ivy-level";
  if (score >= 1400) return "Highly selective";
  if (score >= 1250) return "Competitive";
  if (score >= 1100) return "Above average";
  return "Solid start";
}

/* ---------- dates ---------- */

/** Typical national SAT Saturdays. Students should confirm exact dates on collegeboard.org. */
export const SAT_DATES = ["2026-12-05", "2027-03-13", "2027-05-01", "2027-06-05", "2027-08-28", "2027-10-02", "2027-11-06", "2027-12-04"];

export function parseDate(iso: string) {
  return new Date(iso + "T00:00:00");
}

export function daysUntil(iso: string, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((parseDate(iso).getTime() - start.getTime()) / 86400000);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }) {
  return parseDate(iso).toLocaleDateString("en-US", opts);
}

export function upcomingDates(from = new Date()) {
  return SAT_DATES.filter((d) => daysUntil(d, from) >= 7)
    .slice(0, 4)
    .map((iso) => ({ iso, days: daysUntil(iso, from) }));
}

/** Graduating-class options relative to today (a "senior" graduates next June once it's July or later). */
export function classOptions(from = new Date()) {
  const senior = from.getMonth() >= 6 ? from.getFullYear() + 1 : from.getFullYear();
  const labels = ["Senior", "Junior", "Sophomore", "Freshman"];
  return [
    ...labels.map((l, i) => ({ value: String(senior + i), label: `Class of ${senior + i}`, sub: l })),
    { value: "other", label: "Other", sub: "Not in high school, or somewhere else" },
  ];
}

/* ---------- plan ---------- */

export const STUDY_OPTIONS = [
  { minutes: 15, label: "Light", sub: "15 min a day" },
  { minutes: 30, label: "Steady", sub: "30 min a day" },
  { minutes: 60, label: "Serious", sub: "1 hour a day" },
  { minutes: 90, label: "All in", sub: "90 min a day" },
];

/** ~2.5 minutes per question, including reading the explanation. */
export function questionsPerDay(minutes: number) {
  return Math.max(4, Math.round(minutes / 2.5));
}

export function domainSection(domain: string): Section | null {
  for (const sec of ["math", "rw"] as Section[]) if (TAXONOMY[sec].some((d) => d.domain === domain)) return sec;
  return null;
}

export type PlanDay = { day: string; kind: "practice" | "review" | "test" | "rest"; label: string };

export type Plan = {
  gain: number | null;
  days: number | null;
  perDay: number;
  totalQuestions: number | null;
  weeks: number | null;
  focus: string[];
  week: PlanDay[];
  start: { label: string; href: string };
  headline: string;
};

export function buildPlan(a: OnboardingAnswers, from = new Date()): Plan {
  const minutes = a.studyMinutes ?? 30;
  const perDay = questionsPerDay(minutes);
  const days = a.testDate ? Math.max(0, daysUntil(a.testDate, from)) : null;
  const gain = a.targetScore !== null && a.currentScore !== null ? a.targetScore - a.currentScore : null;
  const totalQuestions = days !== null ? Math.round(days * perDay * 0.85) : null; // 15% rest/life days
  const weeks = days !== null ? Math.max(1, Math.round(days / 7)) : null;

  const f = a.focus;
  const sec = (i: number): Section => (f.length ? domainSection(f[i % f.length]) ?? "math" : i % 2 ? "rw" : "math");
  const dom = (i: number) => (f.length ? f[i % f.length] : sec(i) === "math" ? "Math skills" : "Reading & Writing");
  const crunch = days !== null && days <= 21;

  const week: PlanDay[] = [
    { day: "Mon", kind: "practice", label: dom(0) },
    { day: "Tue", kind: "practice", label: dom(1) },
    { day: "Wed", kind: "practice", label: dom(2) },
    { day: "Thu", kind: "review", label: "Mistake review" },
    { day: "Fri", kind: "practice", label: dom(3) },
    { day: "Sat", kind: "test", label: crunch ? "Full practice test" : "Timed module" },
    { day: "Sun", kind: "rest", label: "Rest + vocab" },
  ];

  let start: Plan["start"];
  if (f.length) {
    const s = domainSection(f[0]) ?? "math";
    start = { label: `Start with ${f[0]}`, href: `/practice/play?section=${s}&domain=${encodeURIComponent(f[0])}&limit=10&title=${encodeURIComponent("Your first session")}` };
  } else {
    start = { label: "Take a baseline test", href: "/tests" };
  }

  const headline =
    gain !== null && gain > 0
      ? `+${gain} points is a real goal.`
      : a.targetScore !== null
        ? `Let's get you to ${a.targetScore}.`
        : "Your plan is ready.";

  return { gain, days, perDay, totalQuestions, weeks, focus: f, week, start, headline };
}

/** Validates/normalizes untrusted answers (used by the API). Returns null for invalid fields. */
export function sanitizeAnswers(b: Record<string, unknown>) {
  const num = (v: unknown, lo: number, hi: number, step = 1) => {
    const n = Number(v);
    return v === null || v === undefined || v === "" || !Number.isFinite(n) ? null : Math.min(hi, Math.max(lo, Math.round(n / step) * step));
  };
  const allDomains = [...TAXONOMY.math, ...TAXONOMY.rw].map((d) => d.domain);
  const focus = Array.isArray(b.focus) ? [...new Set(b.focus.map(String))].filter((d) => allDomains.includes(d)) : [];
  const cls = String(b.gradClass ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.testDate ?? "")) ? String(b.testDate) : null;
  return {
    currentScore: num(b.currentScore, 400, 1600, 10),
    targetScore: num(b.targetScore, 400, 1600, 10),
    gradClass: /^\d{4}$/.test(cls) || cls === "other" ? cls : null,
    testDate: date,
    studyMinutes: num(b.studyMinutes, 10, 240, 5),
    focus,
  };
}
