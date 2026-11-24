import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanQuote, extractSteps, followUpRequest, lessonRequest, parseLesson, quickAsks, sanitizeMark, trimHistory, LIMITS } from "../src/lib/tutor-lesson";

const MCQ = { answer: "C", choices: 4 };
const SPR = { answer: "15", choices: 0 };
const step = (o: object = {}) => ({ say: "Look at the second sentence.", marks: [], board: [], ...o });
const lesson = (...steps: unknown[]) => JSON.stringify({ steps });

test("parses a clean lesson", () => {
  const p = parseLesson(lesson(step({ marks: [{ kind: "highlight", on: "passage", quote: "the data", note: "evidence" }], board: ["x = 5"] })), MCQ);
  assert.equal(p.complete, true);
  assert.equal(p.steps.length, 1);
  assert.deepEqual(p.steps[0].marks, [{ kind: "highlight", on: "passage", quote: "the data", note: "evidence" }]);
  assert.deepEqual(p.steps[0].board, ["x = 5"]);
});

test("accepts a code fence and talk around the JSON", () => {
  const body = lesson(step());
  for (const t of ["```json\n" + body + "\n```", "Here you go!\n" + body + "\nHope that helps.", "```\n" + body + "\n```"]) {
    assert.equal(parseLesson(t, MCQ).steps.length, 1, t.slice(0, 20));
  }
});

test("safety: only the right choice can be checked, the right choice can never be struck", () => {
  const checkWrong = sanitizeMark({ kind: "check", choice: "B" }, MCQ);
  const strikeRight = sanitizeMark({ kind: "strike", choice: "C" }, MCQ);
  assert.equal(checkWrong, null);
  assert.equal(strikeRight, null);
  assert.ok(sanitizeMark({ kind: "check", choice: "C" }, MCQ));
  assert.ok(sanitizeMark({ kind: "strike", choice: "B" }, MCQ));
  // lowercase and wordy letters are understood
  assert.equal(sanitizeMark({ kind: "strike", choice: "b)" }, MCQ)?.choice, "B");
  // the rule holds when the choice comes with a quote too
  assert.equal(sanitizeMark({ kind: "strike", choice: "C", quote: "anything" }, MCQ), null);
  // ...and a circle is neutral
  assert.ok(sanitizeMark({ kind: "circle", choice: "B" }, MCQ));
});

test("safety rules apply through parseLesson, not just sanitizeMark", () => {
  const p = parseLesson(lesson(step({ marks: [{ kind: "check", choice: "A" }, { kind: "strike", choice: "C" }, { kind: "strike", choice: "A" }, { kind: "check", choice: "C" }] })), MCQ);
  assert.deepEqual(p.steps[0].marks.map((m) => `${m.kind}${m.choice}`), ["strikeA", "checkC"]);
});

test("choices that do not exist are dropped (e.g. student-produced response questions)", () => {
  assert.equal(sanitizeMark({ kind: "circle", choice: "B" }, SPR), null);
  assert.equal(sanitizeMark({ kind: "circle", choice: "E" }, MCQ), null);
  assert.equal(sanitizeMark({ kind: "circle", on: "choices" }, MCQ), null); // no letter, nothing to point at
  assert.equal(sanitizeMark({ kind: "circle" }, MCQ), null); // no quote, no choice
  assert.ok(sanitizeMark({ kind: "circle", on: "stem", quote: "x + 5" }, SPR));
});

test("unknown kinds are dropped, unknown targets fall back to the passage", () => {
  assert.equal(sanitizeMark({ kind: "sparkle", quote: "x" }, MCQ), null);
  assert.equal(sanitizeMark({ kind: "underline", on: "margin", quote: "x" }, MCQ)?.on, "passage");
  assert.equal(sanitizeMark("nope", MCQ), null);
  assert.equal(sanitizeMark(null, MCQ), null);
});

test("quotes: wrapping quotes, LaTeX wrappers and edge ellipses are removed", () => {
  assert.equal(cleanQuote('"the cat"'), "the cat");
  assert.equal(cleanQuote("“the cat”"), "the cat");
  assert.equal(cleanQuote("\\(3x + 5\\)"), "3x + 5");
  assert.equal(cleanQuote("...the cat..."), "the cat");
  assert.equal(cleanQuote("  \n "), undefined);
  assert.equal(cleanQuote(42), undefined);
  assert.equal(cleanQuote("a".repeat(500))?.length, LIMITS.quote);
});

test("text is cleaned: markdown, LaTeX and 'Step 1:' prefixes go; long text is capped on a word", () => {
  const p = parseLesson(lesson(step({ say: "Step 1: Notice **this** word, and $x^2$.", board: ["\\(3x = 15\\)", "  ", "x = $5$"] })), MCQ);
  assert.equal(p.steps[0].say, "Notice this word, and x^2.");
  assert.deepEqual(p.steps[0].board, ["3x = 15", "x = 5"]);
  const long = parseLesson(lesson(step({ say: "word ".repeat(300) })), MCQ).steps[0].say;
  assert.ok(long.length <= LIMITS.say + 1 && long.endsWith("…"));
});

test("limits: steps, marks per step and board lines are capped", () => {
  const many = Array.from({ length: 12 }, () => step({ marks: Array.from({ length: 9 }, () => ({ kind: "circle", quote: "q" })), board: Array.from({ length: 12 }, (_, i) => String(i)) }));
  const p = parseLesson(lesson(...many), MCQ);
  assert.equal(p.steps.length, LIMITS.steps);
  assert.equal(p.steps[0].marks.length, LIMITS.marks);
  assert.equal(p.steps[0].board.length, LIMITS.board);
});

test("a step with no sentence is dropped, the others survive", () => {
  const p = parseLesson(lesson(step({ say: "" }), step({ say: "Real step." }), { marks: [] }, "junk", null), MCQ);
  assert.deepEqual(p.steps.map((s) => s.say), ["Real step."]);
});

test("streaming: only finished steps are returned", () => {
  const full = lesson(step({ say: "One." }), step({ say: "Two." }), step({ say: "Three." }));
  const cut = full.slice(0, full.indexOf("Three") + 3); // dies in the middle of step 3
  assert.deepEqual(parseLesson(cut, MCQ, false).steps.map((s) => s.say), ["One.", "Two."]);
  assert.equal(parseLesson(cut, MCQ, false).complete, false);
  // earlier still
  const early = full.slice(0, full.indexOf("Two") + 2);
  assert.deepEqual(parseLesson(early, MCQ, false).steps.map((s) => s.say), ["One."]);
  // and nothing before the first step is done
  assert.deepEqual(parseLesson('{"steps":[{"say":"On', MCQ, false).steps, []);
  assert.deepEqual(parseLesson("", MCQ, false).steps, []);
});

test("streaming: braces, brackets and escaped quotes inside text do not confuse the scanner", () => {
  const tricky = step({ say: 'She said "wait } not yet {" and left.', marks: [{ kind: "underline", quote: 'a "quoted" { word }' }] });
  const text = lesson(tricky, step({ say: "Second." }));
  const raw = extractSteps(text.slice(0, text.length - 10));
  assert.equal(raw.length, 1);
  const p = parseLesson(text.slice(0, text.length - 10), MCQ, false);
  assert.equal(p.steps[0].say, 'She said "wait } not yet {" and left.');
  assert.equal(p.steps[0].marks[0].quote, 'a "quoted" { word }');
});

test("every prefix of a reply parses without throwing and never loses steps it already had", () => {
  const full = "Sure!\n```json\n" + lesson(step({ say: "One.", marks: [{ kind: "check", choice: "C" }] }), step({ say: "Two." }), step({ say: "Three." })) + "\n```";
  let seen = 0;
  for (let i = 0; i <= full.length; i++) {
    const n = parseLesson(full.slice(0, i), MCQ, false).steps.length;
    assert.ok(n >= seen, `lost a step at ${i}`);
    seen = n;
  }
  assert.equal(seen, 3);
});

test("a truncated final reply still gives the steps that finished", () => {
  const full = lesson(step({ say: "One." }), step({ say: "Two." }));
  const p = parseLesson(full.slice(0, full.length - 25), MCQ, true);
  assert.equal(p.steps.length >= 1, true);
  assert.equal(p.complete, false);
});

test("prose instead of JSON becomes one text step, but only once the reply is finished", () => {
  const prose = "Think about what the author is comparing. The second sentence gives it away.";
  assert.deepEqual(parseLesson(prose, MCQ, false).steps, []);
  const p = parseLesson(prose, MCQ, true);
  assert.equal(p.plain, true);
  assert.equal(p.steps.length, 1);
  assert.match(p.steps[0].say, /second sentence/);
  // broken JSON is not shown as prose
  assert.deepEqual(parseLesson('{"steps": [{"say": "oops', MCQ, true).steps, []);
  assert.deepEqual(parseLesson("   ", MCQ, true).steps, []);
});

test("lessonRequest carries the question, the official answer and what the student did", () => {
  const q = { section: "rw" as const, skill: "Inferences", difficulty: "M" as const, type: "mcq" as const, stem: "Which choice completes the text?", passage: "The cat sat.", choices: ["a1", "b2", "c3", "d4"] };
  const r = lessonRequest(q, "B", "C", "Because c3.", false);
  for (const s of ["The cat sat.", "A. a1", "D. d4", "Correct answer: C", "The student answered: B (incorrect)", "Because c3."]) assert.ok(r.includes(s), s);
  assert.match(lessonRequest(q, "C", "C", "x", true), /different way/);
  assert.match(r, /where the student's choice went wrong/);
});

test("follow-ups cannot break out of their quotes", () => {
  assert.match(followUpRequest('Why "not" B?'), /asks: "Why 'not' B\?"/);
});

test("quick questions: wrong picks get 'why is B wrong', right picks get 'why are the others wrong'", () => {
  const mcq = { type: "mcq" as const, section: "rw" as const };
  assert.equal(quickAsks(mcq, "B", false)[0], "Why is B wrong?");
  assert.equal(quickAsks(mcq, "C", true)[0], "Why are the other choices wrong?");
  assert.ok(quickAsks({ type: "spr", section: "math" }, "7", false).every((a) => !/wrong/.test(a)));
  assert.ok(quickAsks({ type: "spr", section: "math" }, "7", false).includes("Show me a different way"));
});

test("history trimming keeps the question and the latest exchange, and keeps roles alternating", () => {
  const msgs = Array.from({ length: 9 }, (_, i) => ({ role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant", content: String(i) }));
  const t = trimHistory(msgs);
  assert.deepEqual(t.map((m) => m.content), ["0", "5", "6", "7", "8"]);
  for (let i = 1; i < t.length; i++) assert.notEqual(t[i].role, t[i - 1].role);
  assert.equal(t[0].role, "user");
  assert.equal(trimHistory(msgs.slice(0, 3)).length, 3);
});
