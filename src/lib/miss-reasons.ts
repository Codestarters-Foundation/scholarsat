/** Why a student missed a question. Safe to import from client components (no database here). */
export const MISS_REASONS = [
  { id: "misread", label: "Misread it" },
  { id: "careless", label: "Careless slip" },
  { id: "rushed", label: "Rushed" },
  { id: "dont_know", label: "Didn't know it" },
] as const;

export type MissReasonId = (typeof MISS_REASONS)[number]["id"];

export const isMissReason = (v: unknown): v is MissReasonId => MISS_REASONS.some((r) => r.id === v);
