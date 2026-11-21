import assert from "node:assert/strict";
import test from "node:test";
import { VOCAB, type Vocab } from "../src/data/vocab";
import type { SrsState } from "../src/lib/srs";
import {
  RETRY_GAP,
  SESSION_NEW,
  SESSION_REVIEWS,
  answerStep,
  buildSession,
  checkTyped,
  chooseKind,
  formatDue,
  inflect,
  keyOf,
  locateWord,
  makeQuestion,
  mulberry32,
  splitExample,
  startSession,
  summarize,
  type QuestionKind,
} from "../src/lib/vocab-learn";

const NOW = 1_700_000_000_000;
const v = (word: string, ex: string, pos = "verb", def = "a made-up meaning for testing", kind: Vocab["kind"] = "classic"): Vocab => ({ word, pos, def, ex, kind });
const ALL = new Set(VOCAB.map(keyOf));

// ---------------------------------------------------------------- word forms

test("inflect follows regular English spelling", () => {
  assert.equal(inflect("abdicate", "ed"), "abdicated");
  assert.equal(inflect("abdicate", "ing"), "abdicating");
  assert.equal(inflect("bolster", "s"), "bolsters");
  assert.equal(inflect("ameliorate", "s"), "ameliorates");
  assert.equal(inflect("vindicate", "ed"), "vindicated");
  assert.equal(inflect("justify", "ed"), "justified");
  assert.equal(inflect("justify", "s"), "justifies");
  assert.equal(inflect("relax", "s"), "relaxes");
  assert.equal(inflect("agree", "ing"), "agreeing");
  assert.equal(inflect("feasible", "ly"), "feasibly");
  assert.equal(inflect("subtle", "ly"), "subtly");
  assert.equal(inflect("candid", "ly"), "candidly");
  assert.equal(inflect("pragmatic", "ly"), "pragmatically");
  assert.equal(inflect("lucky", "ly"), "luckily");
});

test("locateWord finds the word in its endings, with capitals and possessives", () => {
  const m = locateWord("abdicate", "The king abdicated the throne.");
  assert.equal(m.length, 1);
  assert.equal(m[0].surface, "abdicated");
  assert.equal(m[0].kind, "ed");
  assert.equal(locateWord("candid", "Candidly, he said no.")[0].kind, "ly");
  assert.equal(locateWord("candid", "Candor, he said.").length, 0, "a different word is not matched");
  assert.equal(locateWord("candid", "He spoke candidly.")[0].kind, "ly");
  assert.equal(locateWord("abdicate", "Abdicate now!")[0].surface, "Abdicate");
  assert.equal(locateWord("tenacity", "The sprinter's tenacity won.")[0].surface, "tenacity");
  assert.equal(locateWord("tenacious", "tenaciously")[0]?.kind, "ly");
  // does not match inside longer words
  assert.equal(locateWord("rate", "The elaborate plan").length, 0);
  assert.equal(locateWord("cling", "She clung to the rail.")[0].surface, "clung");
});

test("splitExample marks the word and keeps the rest intact", () => {
  const parts = splitExample("The king abdicated the throne.", "abdicate");
  assert.deepEqual(parts, [
    { text: "The king ", hit: false },
    { text: "abdicated", hit: true },
    { text: " the throne.", hit: false },
  ]);
  assert.equal(parts.map((p) => p.text).join(""), "The king abdicated the throne.");
  assert.deepEqual(splitExample("No match here.", "abdicate"), [{ text: "No match here.", hit: false }]);
});

// ----------------------------------------------------------------- questions

test("cloze blanks the word, keeps the right ending on every option, and never leaks the answer", () => {
  const rnd = mulberry32(7);
  const target = v("abdicate", "The king abdicated the throne rather than face a civil war.");
  const pool = [target, v("abhor", "x abhors y"), v("abstain", "x"), v("acquiesce", "x"), v("admonish", "x"), v("advocate", "x")];
  const q = makeQuestion(target, "cloze", pool, rnd);
  assert.equal(q.kind, "cloze");
  assert.equal(q.prompt, "The king _____ the throne rather than face a civil war.");
  assert.equal(q.choices.length, 4);
  assert.equal(q.choices[q.answer], "abdicated");
  for (const c of q.choices) assert.ok(c.endsWith("ed"), `${c} should wear the same ending as the sentence needs`);
  assert.equal(new Set(q.choices).size, 4);
});

test("cloze falls back to def2word when the sentence cannot be blanked", () => {
  const target = v("abdicate", "The monarch gave up power quietly.");
  const pool = [target, v("abhor", "x"), v("abstain", "x"), v("acquiesce", "x"), v("admonish", "x")];
  assert.equal(makeQuestion(target, "cloze", pool, mulberry32(1)).kind, "def2word");
});

test("a sentence-initial word keeps its capital on every option", () => {
  const target = v("candid", "Candid feedback helped the team improve.", "adj.");
  const pool = [target, v("lucid", "x", "adj."), v("frugal", "x", "adj."), v("adept", "x", "adj."), v("subtle", "x", "adj.")];
  const q = makeQuestion(target, "cloze", pool, mulberry32(3));
  assert.equal(q.kind, "cloze");
  for (const c of q.choices) assert.match(c, /^[A-Z]/);
  assert.equal(q.choices[q.answer], "Candid");
});

test("distractors share the part of speech", () => {
  const target = v("candid", "He was candid.", "adj.");
  const pool = [target, v("lucid", "x", "adj."), v("frugal", "x", "adj."), v("adept", "x", "adj."), v("abhor", "x", "verb"), v("accolade", "x", "noun")];
  for (let seed = 0; seed < 20; seed++) {
    const q = makeQuestion(target, "def2word", pool, mulberry32(seed));
    assert.ok(!q.choices.includes("abhor") && !q.choices.includes("accolade"), q.choices.join());
  }
});

test("typed question hint gives part of speech, first letter and length", () => {
  const q = makeQuestion(v("abdicate", "The king abdicated."), "type", [], mulberry32(1));
  assert.equal(q.kind, "type");
  assert.deepEqual(q.choices, []);
  assert.equal(q.hint, "verb · starts with “a” · 8 letters");
});

test("def2word with a tiny pool degrades to typed recall instead of crashing", () => {
  const t = v("abdicate", "The king abdicated.");
  assert.equal(makeQuestion(t, "def2word", [t], mulberry32(1)).kind, "type");
});

test("checkTyped accepts the word, its endings and one slip, but not a different real word", () => {
  const t = v("prescribe", "The doctor prescribed rest.");
  assert.equal(checkTyped("prescribe", t, ALL), "correct");
  assert.equal(checkTyped("  Prescribe ", t, ALL), "correct");
  assert.equal(checkTyped("prescribed", t, ALL), "correct");
  assert.equal(checkTyped("presribe", t, ALL), "close");
  assert.equal(checkTyped("proscribe", t, new Set(["proscribe"])), "wrong");
  assert.equal(checkTyped("", t, ALL), "wrong");
  assert.equal(checkTyped("banana", t, ALL), "wrong");
  // short words get no spelling forgiveness
  assert.equal(checkTyped("abat", v("abate", "x abated")), "wrong");
});

// --------------------------------------------- the whole real vocabulary bank

test("real bank: every word yields well-formed questions of every kind", () => {
  const rnd = mulberry32(2024);
  let cloze = 0;
  for (const w of VOCAB) {
    for (const kind of ["def2word", "cloze", "type"] as QuestionKind[]) {
      const q = makeQuestion(w, kind, VOCAB, rnd);
      assert.equal(q.target, w);
      if (q.kind === "type") {
        assert.equal(q.answer, -1);
        assert.equal(checkTyped(w.word, w, ALL), "correct", w.word);
        continue;
      }
      assert.equal(q.choices.length, 4, `${w.word} ${q.kind}`);
      assert.equal(new Set(q.choices.map((c) => c.toLowerCase())).size, 4, `${w.word}: duplicate options ${q.choices}`);
      assert.ok(q.answer >= 0 && q.answer < 4);
      if (q.kind === "def2word") {
        assert.equal(q.choices[q.answer], w.word);
      } else {
        cloze++;
        assert.ok(q.prompt.includes("_____"), w.word);
        assert.equal(locateWord(w.word, q.prompt).length, 0, `${w.word}: the blanked sentence still contains the word: ${q.prompt}`);
        assert.ok(locateWord(w.word, w.ex).some((m) => m.surface.toLowerCase() === q.choices[q.answer].toLowerCase()), `${w.word}: wrong answer string`);
        // every wrong option is a different real-looking word, not the target in disguise
        for (const [i, c] of q.choices.entries()) if (i !== q.answer) assert.equal(locateWord(w.word, c).length, 0, `${w.word}: option ${c} is a form of the target`);
      }
    }
  }
  const coverage = cloze / VOCAB.length;
  console.log(`      cloze coverage: ${cloze}/${VOCAB.length} (${(coverage * 100).toFixed(1)}%)`);
  assert.ok(coverage > 0.9, `only ${(coverage * 100).toFixed(1)}% of words can make a cloze question`);
});


test("real bank: past-tense options are never irregular verbs built with a regular ending", () => {
  const bad = new Set(["drawed", "holded", "clinged", "lended", "striked", "undertaked", "upholded", "beared", "casted", "withstanded", "sheded", "undercutted", "bended", "sended"]);
  for (let seed = 0; seed < 6; seed++) {
    const rnd = mulberry32(seed);
    for (const w of VOCAB) {
      const q = makeQuestion(w, "cloze", VOCAB, rnd);
      for (const c of q.kind === "cloze" ? q.choices : []) assert.ok(!bad.has(c.toLowerCase()), `${w.word}: bad option ${c}`);
    }
  }
});

test("irregular past forms in example sentences are still found and blanked", () => {
  for (const [lemma, ex] of [["strike", "The clock struck noon."], ["uphold", "The court upheld the ruling."], ["draw", "She drew a map."], ["hold", "He held firm."]] as const) {
    const q = makeQuestion(v(lemma, ex), "cloze", VOCAB.filter((x) => x.pos === "verb"), mulberry32(1));
    assert.equal(q.kind, "cloze", lemma);
    assert.ok(q.prompt.includes("_____") && !/struck|upheld|drew|held/.test(q.prompt), q.prompt);
  }
});

// ------------------------------------------------------------------ sessions

const srsAt = (box: number, due: number): SrsState => ({ box, due, reps: box, lapses: 0 });

test("buildSession: due words first (oldest due), plus new words, known words skipped", () => {
  const words = VOCAB.slice(0, 80);
  const srs: Record<string, SrsState> = {};
  words.slice(0, 4).forEach((w, i) => (srs[keyOf(w)] = srsAt(1, NOW - (4 - i) * 1000)));
  srs[keyOf(words[10])] = srsAt(2, NOW + 99_999); // learned, not yet due
  const known = new Set([keyOf(words[20])]);
  const items = buildSession(words, srs, known, NOW, mulberry32(1));
  const reviews = items.filter((i) => !i.isNew);
  const fresh = items.filter((i) => i.isNew);
  assert.equal(reviews.length, 4);
  assert.equal(fresh.length, SESSION_NEW);
  assert.deepEqual(new Set(reviews.map((i) => keyOf(i.word))), new Set(words.slice(0, 4).map(keyOf)));
  assert.ok(items.indexOf(reviews[reviews.length - 1]) < items.indexOf(fresh[0]), "reviews come before new words");
  assert.ok(!items.some((i) => keyOf(i.word) === keyOf(words[10])), "not-yet-due words are left alone");
  assert.ok(!items.some((i) => keyOf(i.word) === keyOf(words[20])), "words marked known are not re-taught");
  assert.ok(fresh.every((i) => i.box === 0));
  // essentials are introduced in list order
  assert.deepEqual(fresh.map((i) => keyOf(i.word)), words.filter((w) => !srs[keyOf(w)] && !known.has(keyOf(w))).slice(0, SESSION_NEW).map(keyOf));
});

test("buildSession: caps reviews, and a big backlog pauses new words", () => {
  const srs: Record<string, SrsState> = {};
  VOCAB.slice(0, 40).forEach((w, i) => (srs[keyOf(w)] = srsAt(1, NOW - 1000 - i)));
  const items = buildSession(VOCAB, srs, new Set(), NOW, mulberry32(1));
  assert.equal(items.length, SESSION_REVIEWS);
  assert.ok(items.every((i) => !i.isNew));
  // the 10 most overdue
  assert.deepEqual(new Set(items.map((i) => keyOf(i.word))), new Set(VOCAB.slice(30, 40).map(keyOf)));
});

test("buildSession: 'ahead' pulls the soonest-due words when nothing is due", () => {
  const srs: Record<string, SrsState> = {};
  VOCAB.slice(0, 12).forEach((w, i) => (srs[keyOf(w)] = srsAt(2, NOW + 1000 * (i + 1))));
  assert.equal(buildSession(VOCAB.slice(0, 12), srs, new Set(VOCAB.slice(0, 12).map(keyOf)), NOW, mulberry32(1)).length, 0);
  const ahead = buildSession(VOCAB.slice(0, 12), srs, new Set(), NOW, mulberry32(1), { ahead: true });
  assert.equal(ahead.length, SESSION_REVIEWS);
  assert.ok(ahead.every((i) => !i.isNew));
});

test("buildSession never repeats a word and is deterministic for a seed", () => {
  const a = buildSession(VOCAB, {}, new Set(), NOW, mulberry32(5));
  const b = buildSession(VOCAB, {}, new Set(), NOW, mulberry32(5));
  assert.deepEqual(a.map((i) => i.word.word), b.map((i) => i.word.word));
  assert.equal(new Set(a.map((i) => i.word.word)).size, a.length);
});

test("summarize counts due, new, learning, mastered and the next due time", () => {
  const words = VOCAB.slice(0, 10);
  const srs: Record<string, SrsState> = {
    [keyOf(words[0])]: srsAt(1, NOW - 1),
    [keyOf(words[1])]: srsAt(2, NOW + 5000),
    [keyOf(words[2])]: srsAt(4, NOW + 1000),
    [keyOf(words[3])]: srsAt(5, NOW - 50),
  };
  const s = summarize(words, srs, new Set([keyOf(words[4])]), NOW);
  assert.deepEqual(s, { due: 2, fresh: 5, learning: 2, mastered: 2, nextDue: NOW + 1000 });
});

test("chooseKind climbs with the box, and a retry switches question type", () => {
  const item = (box: number) => ({ word: VOCAB[0], isNew: false, box });
  assert.equal(chooseKind({ item: item(0) }), "def2word");
  assert.equal(chooseKind({ item: item(1) }), "cloze");
  assert.equal(chooseKind({ item: item(2) }), "cloze");
  assert.equal(chooseKind({ item: item(3) }), "type");
  assert.equal(chooseKind({ item: item(5) }), "type");
  assert.equal(chooseKind({ item: item(3), retryOf: "type" }), "def2word");
  assert.equal(chooseKind({ item: item(0), retryOf: "def2word" }), "cloze");
});

test("session machine: miss re-queues a few cards later, only the first try is reported", () => {
  const items = VOCAB.slice(0, 6).map((w) => ({ word: w, isNew: true, box: 0 }));
  let s = startSession(items);
  const reports: { word: string; correct: boolean }[] = [];
  const answer = (kind: QuestionKind, ok: boolean) => {
    const r = answerStep(s, kind, ok);
    s = r.state;
    if (r.report) reports.push(r.report);
  };
  const first = keyOf(items[0].word);
  answer("def2word", false); // miss word 0
  assert.equal(s.queue.length, 6, "missed card stays in the queue");
  assert.equal(keyOf(s.queue[RETRY_GAP].item.word), first, `comes back ${RETRY_GAP} cards later`);
  assert.equal(s.queue[RETRY_GAP].retryOf, "def2word");
  assert.equal(s.done, 0);
  answer("def2word", true);
  answer("def2word", true);
  answer("def2word", true);
  assert.equal(keyOf(s.queue[0].item.word), first);
  answer("cloze", true); // retry succeeds
  assert.equal(s.done, 4);
  assert.deepEqual(reports.map((r) => [r.word, r.correct]), [
    [first, false],
    [keyOf(items[1].word), true],
    [keyOf(items[2].word), true],
    [keyOf(items[3].word), true],
  ], "the retry is not reported, so the miss stays a miss");
  answer("def2word", true);
  answer("def2word", true);
  assert.equal(s.queue.length, 0);
  assert.equal(s.done, 6);
  assert.equal(s.total, 6);
  assert.equal(Object.values(s.firstTry).filter(Boolean).length, 5);
});

test("session machine: missing the last card re-queues it at the end and answering an empty queue is a no-op", () => {
  let s = startSession([{ word: VOCAB[0], isNew: false, box: 2 }]);
  const r = answerStep(s, "cloze", false);
  s = r.state;
  assert.equal(s.queue.length, 1);
  assert.equal(s.queue[0].retryOf, "cloze");
  s = answerStep(s, "def2word", true).state;
  assert.equal(s.queue.length, 0);
  const again = answerStep(s, "def2word", true);
  assert.equal(again.report, null);
  assert.equal(again.state, s);
});

test("session machine does not mutate the state it is given", () => {
  const s = startSession(VOCAB.slice(0, 3).map((w) => ({ word: w, isNew: false, box: 1 })));
  const snapshot = JSON.stringify(s);
  answerStep(s, "cloze", false);
  answerStep(s, "cloze", true);
  assert.equal(JSON.stringify(s), snapshot);
});

test("formatDue is human readable", () => {
  assert.equal(formatDue(NOW + 30_000, NOW), "now");
  assert.equal(formatDue(NOW + 10 * 60_000, NOW), "in 10 min");
  assert.equal(formatDue(NOW + 3 * 3_600_000, NOW), "in 3 hours");
  assert.equal(formatDue(NOW + 1 * 3_600_000, NOW), "in 1 hour");
  assert.equal(formatDue(NOW + 30 * 3_600_000, NOW), "tomorrow");
  assert.equal(formatDue(NOW + 3 * 86_400_000, NOW), "in 3 days");
});
