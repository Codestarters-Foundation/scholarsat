/** Score math shared by the dashboard, diagnostics, and the score calculator (pure: safe on server and client). */

/** Section score (200–800) from accuracy (0–1). Same curve the dashboard's predicted score uses. */
export function sectionScore(acc: number) {
  const a = Math.max(0, Math.min(1, acc));
  return Math.min(800, Math.max(200, Math.round((200 + 600 * Math.pow(a, 1.15)) / 10) * 10));
}

export const MIN_FOR_PREDICTION = 10;

/** Estimated total from raw correct counts per module (the calculator). */
export function estimateFromRaw(raw: { rw1: number; rw2: number; m1: number; m2: number }, max = { rw: 27, m: 22 }) {
  const rw = sectionScore((raw.rw1 + raw.rw2) / (max.rw * 2));
  const math = sectionScore((raw.m1 + raw.m2) / (max.m * 2));
  return { rw, math, total: rw + math };
}
