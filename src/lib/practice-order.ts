import type { Question } from "./types";

/** Shuffle first, then space exercises based on the same reading or math method. */
export function practiceOrder(pool: Pick<Question, "id" | "family" | "skill">[], random = Math.random, limit = pool.length) {
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const buckets = new Map<string, typeof shuffled>();
  for (const q of shuffled) {
    const bucket = buckets.get(q.skill);
    if (bucket) bucket.push(q); else buckets.set(q.skill,[q]);
  }
  const uses = new Map<string,number>();
  const result: string[] = [];
  const count = limit > 0 ? Math.min(limit,pool.length) : pool.length;
  while (result.length < count) {
    for (const [skill,bucket] of buckets) {
      let best = bucket.length-1, least = Infinity;
      for (let i = bucket.length-1; i >= 0; i--) {
        const times = uses.get(bucket[i].family ?? bucket[i].id) ?? 0;
        if (times < least) { best = i; least = times; }
        if (!times) break;
      }
      const q = bucket[best];
      bucket[best] = bucket[bucket.length-1]; bucket.pop();
      if (!bucket.length) buckets.delete(skill);
      if (q.family) uses.set(q.family,least+1);
      result.push(q.id);
      if (result.length===count) break;
    }
  }
  return result;
}
