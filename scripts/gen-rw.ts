import { LETTERS, hashId, rng, type R } from "./lib";
import type { Difficulty, Question } from "../src/lib/types";
import * as C from "./rw-conventions";
import * as RD from "./rw-reading";

const SEC = "Standard English Conventions", EOI = "Expression of Ideas", II = "Information and Ideas", CS = "Craft and Structure";
const CONV_STEM = "Which choice completes the text so that it conforms to the conventions of Standard English?";

function make(r: R, o: { domain: string; skill: string; d: Difficulty; passage: string; passage2?: string; stem: string; right: string; wrong: string[]; why: string; table?: Question["table"] }): Question {
  const choices = r.shuffle([o.right, ...o.wrong.slice(0, 3)]);
  const key = o.passage + "|" + o.stem + "|" + o.right;
  return {
    id: hashId("r", key), section: "rw", domain: o.domain, skill: o.skill, difficulty: o.d, type: "mcq",
    passage: o.passage, passage2: o.passage2, table: o.table, stem: o.stem, choices, answer: LETTERS[choices.indexOf(o.right)], explanation: o.why,
  };
}

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lastWord = (s: string) => s.trim().split(/\s+/).pop()!;
const firstWord = (s: string) => s.trim().split(/\s+/)[0];
const dropLast = (s: string) => s.trim().split(/\s+/).slice(0, -1).join(" ");
const dropFirst = (s: string) => s.trim().split(/\s+/).slice(1).join(" ");

export function generateRW(seed = 7): Question[] {
  const r = rng(seed);
  const out: Question[] = [];

  // Boundaries: two independent clauses
  for (const f of C.IC_SPLITS) {
    const a = lastWord(f.first), b = firstWord(f.second);
    out.push(make(r, {
      domain: SEC, skill: "Boundaries", d: f.d, stem: CONV_STEM,
      passage: `${dropLast(f.first)} ______ ${dropFirst(f.second)}`,
      right: `${a}; ${lc(b)}`, wrong: [`${a}, ${lc(b)}`, `${a} ${lc(b)}`, `${a}, and, ${lc(b)}`],
      why: `Both parts are independent clauses. A semicolon correctly joins them; a comma alone creates a comma splice, and no punctuation creates a run-on sentence.`,
    }));
    // period variant
    out.push(make(r, {
      domain: SEC, skill: "Boundaries", d: f.d === "E" ? "M" : f.d, stem: CONV_STEM,
      passage: `${dropLast(f.first)} ______ ${dropFirst(f.second)}`,
      right: `${a}. ${uc(b)}`, wrong: [`${a}, ${lc(b)}`, `${a} ${lc(b)}`, `${a}, ${uc(b)}`],
      why: `The text contains two independent clauses. Separating them with a period is correct. A comma alone (a comma splice) or no punctuation (a run-on) is not.`,
    }));
  }
  // Boundaries: introductory element
  for (const f of C.INTRO_SPLITS) {
    const a = lastWord(f.intro), b = firstWord(f.main);
    out.push(make(r, {
      domain: SEC, skill: "Boundaries", d: f.d, stem: CONV_STEM,
      passage: `${dropLast(f.intro)} ______ ${dropFirst(f.main)}`,
      right: `${a}, ${b}`, wrong: [`${a}; ${b}`, `${a}. ${uc(b)}`, `${a}: ${b}`],
      why: `"${f.intro}" is an introductory element, not an independent clause. A comma correctly separates it from the main clause; a semicolon, period, or colon would leave a fragment.`,
    }));
  }
  // Boundaries: colon
  for (const f of C.COLON_SPLITS) {
    const a = lastWord(f.before), b = firstWord(f.after);
    out.push(make(r, {
      domain: SEC, skill: "Boundaries", d: f.d, stem: CONV_STEM,
      passage: `${dropLast(f.before)} ______ ${dropFirst(f.after)}`,
      right: `${a}: ${b}`, wrong: [`${a}; ${b}`, `${a}, ${b}`, `${a} ${b}`],
      why: `The first part is a complete clause, and what follows explains or lists what it introduces. A colon is the correct punctuation for this relationship.`,
    }));
  }
  // Boundaries: paired commas around nonessential element
  for (const f of C.APPOSITIVES) {
    const a = lastWord(f.appos), b = firstWord(f.rest);
    out.push(make(r, {
      domain: SEC, skill: "Boundaries", d: f.d, stem: CONV_STEM,
      passage: `${f.start}, ${dropLast(f.appos)} ______ ${dropFirst(f.rest)}`,
      right: `${a}, ${b}`, wrong: [`${a} ${b}`, `${a}; ${b}`, `${a}: ${b}`],
      why: `"${f.appos}" is a nonessential element that begins with a comma, so it must also end with a comma before the sentence continues.`,
    }));
  }
  // Form, Structure, and Sense
  for (const list of [C.SV_FRAMES, C.TENSE_FRAMES, C.PRONOUN_FRAMES, C.POSSESSIVE_FRAMES]) {
    for (const f of list) {
      out.push(make(r, {
        domain: SEC, skill: "Form, Structure, and Sense", d: f.d, stem: CONV_STEM,
        passage: `${f.pre} ______ ${f.post}`, right: f.right, wrong: f.wrong, why: f.why,
      }));
    }
  }
  // Transitions
  const rels = Object.keys(C.TRANSITION_WORDS) as C.Relation[];
  for (const t of C.TRANSITIONS) {
    for (let v = 0; v < 2; v++) {
      const right = r.pick(C.TRANSITION_WORDS[t.rel]);
      const others = r.shuffle(rels.filter((x) => x !== t.rel && !(t.rel === "emphasis" && x === "addition") && !(t.rel === "addition" && x === "emphasis")));
      const wrong = others.slice(0, 3).map((x) => r.pick(C.TRANSITION_WORDS[x]));
      const label: Record<C.Relation, string> = {
        contrast: "contrasts with", addition: "adds a further point to", cause: "is a result of", example: "gives an example of",
        sequence: "follows in time from", similarity: "describes something similar to", emphasis: "emphasizes and extends",
      };
      out.push(make(r, {
        domain: EOI, skill: "Transitions", d: t.d,
        stem: "Which choice completes the text with the most logical transition?",
        passage: `${t.a} ______ ${t.b}`, right: right, wrong,
        why: `The second sentence ${label[t.rel]} the first. "${right.replace(",", "")}" signals that relationship.`,
      }));
    }
  }
  // Words in context
  for (const w of C.WIC) {
    out.push(make(r, { domain: CS, skill: "Words in Context", d: w.d, stem: "Which choice completes the text with the most logical and precise word or phrase?", passage: w.text, right: w.right, wrong: w.wrong, why: w.why }));
  }
  // Reading items
  const addReading = (items: RD.ReadingItem[], domain: string, skill: string) => {
    for (const it of items) out.push(make(r, { domain, skill, d: it.d, stem: it.stem, passage: it.passage, passage2: it.passage2, right: it.right, wrong: it.wrong, why: it.why }));
  };
  addReading(RD.CENTRAL, II, "Central Ideas and Details");
  addReading(RD.INFERENCES, II, "Inferences");
  addReading(RD.EVIDENCE_TEXT, II, "Command of Evidence");
  addReading(RD.PURPOSE, CS, "Text Structure and Purpose");
  addReading(RD.CROSS_TEXT, CS, "Cross-Text Connections");
  // Rhetorical synthesis
  for (const s of RD.SYNTH) {
    out.push(make(r, {
      domain: EOI, skill: "Rhetorical Synthesis", d: s.d,
      passage: "While researching a topic, a student has taken the following notes:\n" + s.notes.map((n) => "• " + n).join("\n"),
      stem: `The student wants to ${s.goal}. Which choice most effectively uses relevant information from the notes to accomplish this goal?`,
      right: s.right, wrong: s.wrong, why: `Only this choice accomplishes the goal to ${s.goal}. The other choices state accurate details from the notes but do not address the goal.`,
    }));
  }
  // Quantitative command of evidence (generated tables)
  for (let i = 0; i < 90; i++) {
    const ctx = r.pick(RD.QUANT_CONTEXTS);
    const yearA = 2020 + r.int(0, 2), yearB = yearA + r.int(1, 3);
    const vals = ctx.groups.map(() => [r.int(20, 90), r.int(20, 90)]);
    // pick a target group whose value increased the most
    const deltas = vals.map(([a, b]) => b - a);
    const best = deltas.indexOf(Math.max(...deltas));
    if (deltas.filter((d) => d === deltas[best]).length > 1 || deltas[best] <= 0) continue;
    const g = ctx.groups[best];
    const right = `${g}'s ${ctx.subject} rose from ${vals[best][0]} to ${vals[best][1]} ${ctx.unit}, the largest increase of any ${ctx.claimNoun} in the table.`;
    const wrongIdx = r.shuffle([0, 1, 2, 3].filter((x) => x !== best)).slice(0, 3);
    const wrong = wrongIdx.map((j, k) =>
      k === 0 ? `${ctx.groups[j]}'s ${ctx.subject} was ${vals[j][1]} ${ctx.unit} in ${yearB}.`
      : k === 1 ? `${ctx.groups[j]}'s ${ctx.subject} changed from ${vals[j][0]} to ${vals[j][1]} ${ctx.unit}.`
      : `${g}'s ${ctx.subject} was ${vals[best][0]} ${ctx.unit} in ${yearA}.`);
    out.push(make(r, {
      domain: II, skill: "Command of Evidence", d: r.pick(["M", "H"] as const),
      table: { caption: `${uc(ctx.subject)} (${ctx.unit})`, headers: [uc(ctx.claimNoun), String(yearA), String(yearB)], rows: ctx.groups.map((name, j) => [name, vals[j][0], vals[j][1]]) },
      passage: `A student is analyzing the table, which shows ${ctx.subject} for four groups in ${yearA} and ${yearB}. The student claims that, of the four, ${g} showed the greatest growth between ${yearA} and ${yearB}.`,
      stem: "Which choice most effectively uses data from the table to support the student's claim?",
      right, wrong,
      why: `The claim concerns growth from ${yearA} to ${yearB}. Only this choice compares ${g}'s change with the other groups and shows it was the largest increase (${deltas[best]} ${ctx.unit}).`,
    }));
  }
  // dedupe by id
  const seen = new Set<string>();
  return out.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
}
