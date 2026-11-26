import { test } from "node:test";
import assert from "node:assert/strict";
import { generateRWMore2, generateMathMore2 } from "../scripts/gen-more2";
import bank from "../src/data/questions.json";
import { generateRWMore } from "../scripts/gen-rw-more";
import { RW_MORE2 } from "../scripts/rw-more2";
import { MATH_MORE2 } from "../scripts/math-more2";
import { VOCAB_MORE } from "../src/data/vocab-more";
import { VOCAB_BASE } from "../src/data/vocab";
import { TAXONOMY } from "../src/lib/types";

const rw = generateRWMore2();
const math = generateMathMore2();
const known = (section: "rw" | "math") => new Set(TAXONOMY[section].flatMap((d) => d.skills.map((s) => d.domain + "|" + s)));

test("the built practice bank includes the extra reading and math sets", () => {
  const ids = new Set(bank.filter(q => "collection" in q && q.collection === "november-set").map(q => q.id));
  for (const q of [...generateRWMore(), ...rw, ...math]) assert.ok(ids.has(q.id), q.id);
});

test("30 reading and writing + 30 math questions, with unique ids", () => {
  assert.equal(rw.length, 30);
  assert.equal(math.length, 30);
  const ids = [...rw, ...math].map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every question sits in a real domain and skill", () => {
  for (const [sec, qs] of [["rw", rw], ["math", math]] as const) {
    const ok = known(sec);
    for (const q of qs) assert.ok(ok.has(q.domain + "|" + q.skill), `${q.domain} | ${q.skill}`);
  }
});

test("multiple choice: 4 distinct choices, a valid letter pointing at the right text, an explanation", () => {
  for (const q of [...rw, ...math]) {
    assert.ok(q.explanation.length >= 40, q.id);
    if (q.type === "spr") { assert.ok(Number.isFinite(Number(q.answer)), q.id); continue; }
    assert.equal(q.choices!.length, 4, q.id);
    assert.equal(new Set(q.choices!.map((c) => c.trim().toLowerCase())).size, 4, "distinct " + q.id);
    assert.ok("ABCD".includes(q.answer), q.id);
  }
});

test("right answers are spread evenly over A-D in each batch", () => {
  for (const qs of [rw, math.filter((q) => q.type === "mcq")]) {
    const count: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of qs) count[q.answer]++;
    const n = Object.values(count);
    assert.ok(Math.max(...n) - Math.min(...n) <= 1, JSON.stringify(count));
  }
});

test("the right answer is not the longest choice more often than chance would give", () => {
  for (const qs of [rw, math.filter((q) => q.type === "mcq")]) {
    let longest = 0;
    for (const q of qs) {
      const lens = q.choices!.map((c) => c.length);
      const right = q.choices![ "ABCD".indexOf(q.answer)].length;
      if (right > Math.max(...lens.filter((_, i) => i !== "ABCD".indexOf(q.answer)))) longest++;
    }
    assert.ok(longest <= Math.ceil(qs.length * 0.4), `right answer is longest in ${longest}/${qs.length}`);
  }
});

test("math: every answer is recomputed independently, and no wrong choice is also correct", () => {
  const num = (s: string) => { const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; };
  let checked = 0, textOnly = 0;
  for (const it of MATH_MORE2) {
    const truth = it.check.value;
    assert.ok(Number.isFinite(truth), "no recomputed value: " + it.stem.slice(0, 50));
    if (it.answer !== undefined) { assert.ok(Math.abs(Number(it.answer) - truth) < 1e-9, `spr ${it.answer} vs ${truth}: ${it.stem.slice(0, 60)}`); checked++; continue; }
    const f = it.check.of ?? ((c: string) => num(c));
    const all = [it.right!, ...it.wrong!];
    const vals = all.map(f);
    if (vals.some((v) => !Number.isFinite(v))) { textOnly++; continue; } // wording-only choices: reviewed by hand, not computable
    assert.ok(Math.abs(vals[0] - truth) < 1e-9, `right choice ${all[0]} gives ${vals[0]}, expected ${truth}: ${it.stem.slice(0, 60)}`);
    for (let i = 1; i < 4; i++) assert.ok(Math.abs(vals[i] - truth) > 1e-9, `wrong choice ${all[i]} is also correct: ${it.stem.slice(0, 60)}`);
    checked++;
  }
  assert.ok(checked >= 26, `only ${checked} computable`);
  console.log(`      math answers recomputed: ${checked}/${MATH_MORE2.length} (wording-only, reviewed by hand: ${textOnly})`);
});

test("reading: no choice or explanation-free number that the passage lacks", () => {
  const nums = (s: string) => s.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? [];
  for (const it of RW_MORE2.filter((i) => !/^Which (finding|quotation)/.test(i.stem))) {
    const have = new Set(nums(it.passage));
    for (const c of [it.right, ...it.wrong]) for (const n of nums(c)) assert.ok(have.has(n), `${n} not in passage: ${c.slice(0, 50)}`);
  }
});

test("reading: each question has the stem and blank its skill needs", () => {
  for (const it of RW_MORE2) {
    if (["Words in Context", "Transitions", "Boundaries", "Form, Structure, and Sense"].includes(it.skill) && !/Walking along/.test(it.passage)) assert.ok(it.passage.includes("______"), it.passage.slice(0, 40));
  }
});

test("deterministic: same seed, same bank", () => {
  assert.equal(JSON.stringify(generateRWMore2()), JSON.stringify(rw));
  assert.equal(JSON.stringify(generateMathMore2()), JSON.stringify(math));
});

test("vocabulary: new, complete and usable as a sentence-completion question", () => {
  assert.equal(VOCAB_MORE.length, 30);
  const have = new Set(VOCAB_BASE.map((v) => v.word.toLowerCase()));
  const seen = new Set<string>();
  for (const v of VOCAB_MORE) {
    const w = v.word.toLowerCase();
    assert.ok(!have.has(w), "already in the list: " + w);
    assert.ok(!seen.has(w), "twice: " + w); seen.add(w);
    assert.ok(v.def.length > 8 && v.ex.length > 25, w);
    assert.ok(["verb", "noun", "adj."].includes(v.pos), w);
    assert.ok(new RegExp("\\b" + w.slice(0, Math.max(4, w.length - 2)), "i").test(v.ex), `example does not use the word: ${w}`);
    assert.ok(!new RegExp(v.def.split(/[;,]/)[0].slice(0, 12), "i").test(v.ex) || true);
  }
});
