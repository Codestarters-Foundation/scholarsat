"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { Vocab } from "@/data/vocab";
import { Button, Badge, Card, Progress } from "./ui";
import { Owl } from "./Owl";
import {
  IArrowL,
  IArrowR,
  ICheck,
  IRefresh,
  ISearch,
  ISpeaker,
  IStar,
  ITarget,
  IX,
  ICards,
} from "./icons";

type StudyMode = "flashcards" | "browse" | "quiz";
type DeckFilter = "daily" | "top50" | "context" | "academic" | "learning" | "starred" | "all";

export function VocabStudy({
  words,
  initialKnown,
  initialStarred = [],
  signedIn,
}: {
  words: Vocab[];
  initialKnown: string[];
  initialStarred?: string[];
  signedIn: boolean;
}) {
  const [known, setKnown] = useState<Set<string>>(new Set(initialKnown));
  const [starred, setStarred] = useState<Set<string>>(new Set(initialStarred));
  const [mode, setMode] = useState<StudyMode>("flashcards");
  const [deckFilter, setDeckFilter] = useState<DeckFilter>("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [seed, setSeed] = useState(1);

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Pronunciation via Web Speech API
  const speakWord = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
    }
  }, []);

  // Filter curated decks
  const curatedDeck = useMemo(() => {
    switch (deckFilter) {
      case "daily":
        // 15 stable words for today
        return words.slice(0, 15);
      case "top50":
        // Top 50 core Digital SAT words
        return words.slice(0, 50);
      case "context":
        return words.filter((w) => w.kind === "context");
      case "academic":
        return words.filter((w) => w.kind !== "context").slice(0, 150);
      case "learning":
        return words.filter((w) => !known.has(w.word));
      case "starred":
        return words.filter((w) => starred.has(w.word));
      case "all":
      default:
        return words;
    }
  }, [words, deckFilter, known, starred]);

  // Seeded shuffle for the active deck
  const activeDeck = useMemo(() => {
    if (curatedDeck.length <= 1) return curatedDeck;
    let a = seed >>> 0;
    const rnd = () => (
      (a = (a + 0x6d2b79f5) >>> 0),
      ((t) => (
        (t = Math.imul(t ^ (t >>> 15), t | 1)),
        (t ^= t + Math.imul(t ^ (t >>> 7), t | 61)),
        ((t ^ (t >>> 14)) >>> 0) / 4294967296
      ))(a)
    );
    const arr = [...curatedDeck];
    for (let k = arr.length - 1; k > 0; k--) {
      const j = Math.floor(rnd() * (k + 1));
      [arr[k], arr[j]] = [arr[j], arr[k]];
    }
    return arr;
  }, [curatedDeck, seed]);

  // Filter for Browse & Search mode
  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return curatedDeck.filter((w) => {
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.def.toLowerCase().includes(q) ||
        w.ex.toLowerCase().includes(q) ||
        w.pos.toLowerCase().includes(q)
      );
    });
  }, [curatedDeck, searchQuery]);

  const currentWord = activeDeck[Math.min(cardIndex, Math.max(0, activeDeck.length - 1))];

  // Mark word known/learning
  const toggleKnown = useCallback(
    async (word: string, isKnown: boolean) => {
      const next = new Set(known);
      if (isKnown) next.add(word);
      else next.delete(word);
      setKnown(next);

      if (signedIn) {
        fetch("/api/vocab", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ word, known: isKnown }),
        });
      }
    },
    [known, signedIn]
  );

  // Star / bookmark word
  const toggleStar = useCallback(
    async (word: string) => {
      const isStarred = !starred.has(word);
      const next = new Set(starred);
      if (isStarred) next.add(word);
      else next.delete(word);
      setStarred(next);

      if (signedIn) {
        fetch("/api/vocab", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ word, starred: isStarred }),
        });
      }
    },
    [starred, signedIn]
  );

  // Next / Prev flashcard handlers
  const handleNextCard = useCallback(() => {
    setFlipped(false);
    setCardIndex((i) => Math.min(activeDeck.length - 1, i + 1));
  }, [activeDeck.length]);

  const handlePrevCard = useCallback(() => {
    setFlipped(false);
    setCardIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleMarkCurrent = useCallback(
    (isKnown: boolean) => {
      if (!currentWord) return;
      toggleKnown(currentWord.word, isKnown);
      if (cardIndex < activeDeck.length - 1) {
        handleNextCard();
      } else {
        setFlipped(false);
      }
    },
    [currentWord, toggleKnown, cardIndex, activeDeck.length, handleNextCard]
  );

  // Keyboard navigation for flashcards
  useEffect(() => {
    if (mode !== "flashcards") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === "1") {
        e.preventDefault();
        handleMarkCurrent(false);
      } else if (e.key === "2") {
        e.preventDefault();
        handleMarkCurrent(true);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (currentWord) toggleStar(currentWord.word);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, handleNextCard, handlePrevCard, handleMarkCurrent, currentWord, toggleStar]);

  // Generate 5 questions for Quiz Mode
  const quizQuestions = useMemo(() => {
    void seed;
    const pool = activeDeck.length >= 8 ? activeDeck : words;
    const questions = pool.slice(0, 5);
    return questions.map((target) => {
      // Pick 3 random distractor words
      const distractors = words
        .filter((w) => w.word !== target.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const choices = [target, ...distractors].sort(() => 0.5 - Math.random());
      return { target, choices };
    });
  }, [activeDeck, words, seed]);

  const currentQuiz = quizQuestions[quizIndex];

  const handleQuizAnswer = (word: string) => {
    if (quizSubmitted) return;
    setSelectedAnswer(word);
    setQuizSubmitted(true);
    if (currentQuiz && word === currentQuiz.target.word) {
      setQuizScore((s) => s + 1);
      toggleKnown(word, true);
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setSeed((s) => s + 1);
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizFinished(false);
  };

  const currentWordIsKnown = currentWord ? known.has(currentWord.word) : false;
  const currentWordIsStarred = currentWord ? starred.has(currentWord.word) : false;

  return (
    <div className="grid gap-6 animate-rise">
      {/* 4 Balanced Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Mastered</span>
            <ICheck className="h-4 w-4 text-ok" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-medium tabular-nums text-ink">{known.size}</span>
            <span className="text-xs text-muted">/ {words.length} words</span>
          </div>
          <div className="mt-3">
            <Progress value={words.length ? known.size / words.length : 0} tone="ok" className="h-1.5" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <IRefresh className="h-4 w-4 text-gold-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-medium tabular-nums text-ink">
              {words.length - known.size}
            </span>
            <span className="text-xs text-muted">to review</span>
          </div>
          <div className="mt-3">
            <Progress
              value={words.length ? (words.length - known.size) / words.length : 0}
              tone="gold"
              className="h-1.5"
            />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Starred</span>
            <IStar className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-medium tabular-nums text-ink">{starred.size}</span>
            <span className="text-xs text-muted">bookmarked</span>
          </div>
          <p className="mt-3 text-xs text-muted truncate">Quick access focus deck</p>
        </Card>

        <Card className="flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Daily Goal</span>
            <ITarget className="h-4 w-4 text-red" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-medium tabular-nums text-ink">15</span>
            <span className="text-xs text-muted">words/day</span>
          </div>
          <p className="mt-3 text-xs text-ok font-medium">Bite-sized mastery</p>
        </Card>
      </div>

      {/* Main Bar: Study Mode Pills & Deck Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-3 sm:p-4 shadow-card">
        {/* Mode Selector */}
        <div className="inline-flex rounded-xl bg-surface-2 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("flashcards")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              mode === "flashcards"
                ? "bg-white text-ink shadow-xs"
                : "text-muted hover:text-ink hover:bg-white/50"
            }`}
          >
            <ICards className="h-4 w-4" /> Flashcards
          </button>
          <button
            type="button"
            onClick={() => setMode("browse")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              mode === "browse"
                ? "bg-white text-ink shadow-xs"
                : "text-muted hover:text-ink hover:bg-white/50"
            }`}
          >
            <ISearch className="h-4 w-4" /> Browse & Search
          </button>
          <button
            type="button"
            onClick={() => setMode("quiz")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              mode === "quiz"
                ? "bg-white text-ink shadow-xs"
                : "text-muted hover:text-ink hover:bg-white/50"
            }`}
          >
            <ITarget className="h-4 w-4" /> Quick Quiz
          </button>
        </div>

        {/* Curated Deck Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin max-w-full pb-1 sm:pb-0">
          {[
            { id: "daily" as DeckFilter, label: "Daily 15" },
            { id: "top50" as DeckFilter, label: "Top 50 Essentials" },
            { id: "context" as DeckFilter, label: "In Context" },
            { id: "academic" as DeckFilter, label: "Hard Academic" },
            { id: "learning" as DeckFilter, label: `Learning (${words.length - known.size})` },
            { id: "starred" as DeckFilter, label: `Starred (${starred.size})` },
            { id: "all" as DeckFilter, label: `All (${words.length})` },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDeckFilter(d.id);
                setCardIndex(0);
                setFlipped(false);
              }}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                deckFilter === d.id
                  ? "border-red bg-red-50 dark:bg-red-950/30 text-red"
                  : "border-line text-muted hover:text-ink hover:border-line-strong hover:bg-surface"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- MODE 1: FLASHCARDS ---------------- */}
      {mode === "flashcards" && (
        <div className="max-w-2xl mx-auto w-full grid gap-4">
          {activeDeck.length > 0 && currentWord ? (
            <>
              {/* Card Meta & Progress */}
              <div className="flex items-center justify-between text-xs text-muted px-1">
                <span className="font-medium uppercase tracking-wider text-faint">
                  {deckFilter === "daily"
                    ? "Today's Deck"
                    : deckFilter === "top50"
                    ? "Top 50 SAT Essentials"
                    : deckFilter === "context"
                    ? "Words in Context"
                    : "Vocabulary Deck"}
                </span>
                <span className="tabular-nums font-medium">
                  {cardIndex + 1} of {activeDeck.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red transition-all duration-300 rounded-full"
                  style={{ width: `${((cardIndex + 1) / activeDeck.length) * 100}%` }}
                />
              </div>

              {/* The Interactive Tactile Flashcard */}
              <div
                onClick={() => setFlipped((f) => !f)}
                className={`group relative flex flex-col justify-between min-h-[340px] sm:min-h-[380px] w-full rounded-2xl border-2 p-7 sm:p-9 text-center shadow-card cursor-pointer select-none transition-all duration-300 ${
                  flipped
                    ? "border-gold-200 dark:border-gold-700/60 bg-gradient-to-b from-gold-50/70 to-white dark:from-gold-950/20 dark:to-surface"
                    : "border-line bg-white hover:border-red-200 dark:hover:border-red-800/60"
                }`}
                role="button"
                tabIndex={0}
                aria-label={flipped ? "Show word" : "Show definition"}
              >
                {/* Top Strip */}
                <div className="flex items-center justify-between w-full">
                  <Badge tone={currentWord.kind === "context" ? "warn" : "neutral"}>
                    {currentWord.kind === "context" ? "SAT Secondary Sense" : currentWord.pos || "word"}
                  </Badge>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => speakWord(currentWord.word)}
                      title="Listen to pronunciation"
                      className={`p-2 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors ${
                        speaking ? "text-red animate-pulse" : ""
                      }`}
                    >
                      <ISpeaker className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStar(currentWord.word)}
                      title={currentWordIsStarred ? "Remove star" : "Star this word"}
                      className={`p-2 rounded-lg transition-colors ${
                        currentWordIsStarred
                          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          : "text-muted hover:text-ink hover:bg-surface-2"
                      }`}
                    >
                      <IStar className={`h-4 w-4 ${currentWordIsStarred ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Card Content (Front vs Back) */}
                {!flipped ? (
                  <div className="my-auto py-6 animate-rise">
                    <p className="text-4xl sm:text-5xl font-medium tracking-tight text-ink font-serif">
                      {currentWord.word}
                    </p>
                    <p className="mt-3 text-sm italic text-muted">/{currentWord.pos}/</p>
                    <p className="mt-8 text-xs font-medium uppercase tracking-wider text-red group-hover:underline">
                      Tap card or press Space to reveal
                    </p>
                  </div>
                ) : (
                  <div className="my-auto py-4 animate-rise max-w-lg mx-auto">
                    <p className="text-lg font-medium text-gold-600 dark:text-gold-400">
                      {currentWord.word}
                    </p>
                    <p className="mt-3 text-xl sm:text-2xl font-medium text-ink leading-snug">
                      {currentWord.def}
                    </p>
                    <div className="mt-5 rounded-xl bg-surface/80 p-3.5 border border-line text-sm text-ink-2 italic">
                      &ldquo;{currentWord.ex}&rdquo;
                    </div>
                  </div>
                )}

                {/* Bottom Status Indicator */}
                <div className="flex items-center justify-between text-xs text-muted w-full pt-2">
                  <span className="flex items-center gap-1.5">
                    {currentWordIsKnown ? (
                      <span className="text-ok flex items-center gap-1 font-medium">
                        <ICheck className="h-3.5 w-3.5" /> Marked as mastered
                      </span>
                    ) : (
                      <span>Still in practice list</span>
                    )}
                  </span>
                  <span className="text-faint text-[11px] hidden sm:inline">
                    Space: flip · ← / →: nav · 1: learn · 2: know
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handlePrevCard}
                  disabled={cardIndex === 0}
                  className="px-3"
                >
                  <IArrowL className="h-4 w-4" /> Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleMarkCurrent(false)}
                    className="gap-2"
                  >
                    <IRefresh className="h-4 w-4" /> Still learning
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleMarkCurrent(true)}
                    className="gap-2"
                  >
                    <ICheck className="h-4 w-4" /> I know this
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleNextCard}
                  disabled={cardIndex >= activeDeck.length - 1}
                  className="px-3"
                >
                  Next <IArrowR className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="grid min-h-[340px] place-items-center rounded-2xl border-2 border-gold-100 bg-gold-50 dark:bg-gold-950/20 p-8 text-center">
              <div className="flex flex-col items-center">
                <Owl size={96} mood="celebrate" />
                <p className="mt-4 text-2xl font-medium text-ink">Deck completed!</p>
                <p className="mt-1 text-sm text-muted">You have reviewed all words in this deck.</p>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDeckFilter("all");
                      setCardIndex(0);
                    }}
                  >
                    Review all words
                  </Button>
                  <Button
                    onClick={() => {
                      setSeed((s) => s + 1);
                      setCardIndex(0);
                    }}
                  >
                    Reshuffle & restart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODE 2: BROWSE & SEARCH ---------------- */}
      {mode === "browse" && (
        <div className="grid gap-4">
          {/* Search bar */}
          <div className="relative">
            <ISearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, definitions, parts of speech..."
              className="w-full rounded-xl border border-line bg-white pl-10 pr-10 py-2.5 text-sm outline-none transition-all focus:border-red focus:ring-3 focus:ring-red/15 text-ink placeholder:text-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <IX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>
              Showing {filteredWords.length} of {curatedDeck.length} words
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-red hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Balanced 2-Column Word Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map((w) => {
              const isKnown = known.has(w.word);
              const isStarred = starred.has(w.word);

              return (
                <div
                  key={w.word}
                  className={`flex flex-col justify-between rounded-xl border p-4 sm:p-5 transition-all shadow-card ${
                    isKnown
                      ? "border-ok/30 bg-white hover:border-ok"
                      : "border-line bg-white hover:border-line-strong"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-ink font-serif truncate">{w.word}</h3>
                          <button
                            type="button"
                            onClick={() => speakWord(w.word)}
                            className="text-muted hover:text-ink"
                            title="Listen"
                          >
                            <ISpeaker className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted italic mt-0.5">{w.pos}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleStar(w.word)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isStarred ? "text-amber-500" : "text-faint hover:text-ink"
                          }`}
                          title={isStarred ? "Starred" : "Star word"}
                        >
                          <IStar className={`h-4 w-4 ${isStarred ? "fill-amber-500" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleKnown(w.word, !isKnown)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isKnown
                              ? "text-ok bg-ok-50 dark:bg-ok-950/30"
                              : "text-faint hover:text-ink hover:bg-surface-2"
                          }`}
                          title={isKnown ? "Mark as learning" : "Mark as mastered"}
                        >
                          <ICheck className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-ink-2 font-medium leading-relaxed">{w.def}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line text-xs text-muted italic">
                    &ldquo;{w.ex}&rdquo;
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="text-center py-12 border border-dashed border-line rounded-2xl p-6 bg-white">
              <p className="text-lg font-medium text-ink">No words match &ldquo;{searchQuery}&rdquo;</p>
              <p className="mt-1 text-sm text-muted">Try searching another keyword or part of speech.</p>
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")} className="mt-4">
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODE 3: QUICK QUIZ ---------------- */}
      {mode === "quiz" && (
        <div className="max-w-xl mx-auto w-full grid gap-4">
          {!quizFinished && currentQuiz ? (
            <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-card grid gap-6">
              {/* Quiz Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  Question {quizIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-xs font-medium text-ok tabular-nums">
                  Score: {quizScore} / {quizQuestions.length}
                </span>
              </div>

              {/* Progress */}
              <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-300 rounded-full"
                  style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {/* Question prompt */}
              <div className="text-center py-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Which word matches this definition?
                </p>
                <p className="mt-3 text-xl sm:text-2xl font-medium text-ink leading-snug">
                  &ldquo;{currentQuiz.target.def}&rdquo;
                </p>
                <p className="mt-2 text-xs italic text-muted">Part of speech: {currentQuiz.target.pos}</p>
              </div>

              {/* Choices */}
              <div className="grid gap-2.5">
                {currentQuiz.choices.map((choice) => {
                  const isTarget = choice.word === currentQuiz.target.word;
                  const isChosen = selectedAnswer === choice.word;

                  let btnStyle = "border-line bg-surface hover:bg-surface-2 text-ink";
                  if (quizSubmitted) {
                    if (isTarget) {
                      btnStyle =
                        "border-ok bg-ok-50 dark:bg-ok-950/40 text-ok font-medium ring-2 ring-ok/20";
                    } else if (isChosen && !isTarget) {
                      btnStyle = "border-bad bg-bad-50 dark:bg-bad/20 text-bad font-medium";
                    } else {
                      btnStyle = "opacity-50 border-line bg-white text-muted";
                    }
                  }

                  return (
                    <button
                      key={choice.word}
                      type="button"
                      disabled={quizSubmitted}
                      onClick={() => handleQuizAnswer(choice.word)}
                      className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${btnStyle}`}
                    >
                      <span className="font-serif text-base">{choice.word}</span>
                      {quizSubmitted && isTarget && <ICheck className="h-4 w-4 text-ok" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Continue */}
              {quizSubmitted && (
                <div className="pt-2 animate-rise flex flex-col gap-3">
                  <div className="rounded-xl bg-surface p-3 text-xs text-muted border border-line">
                    <span className="font-semibold text-ink">{currentQuiz.target.word}:</span> &ldquo;
                    {currentQuiz.target.ex}&rdquo;
                  </div>
                  <Button onClick={handleNextQuizQuestion} className="w-full">
                    {quizIndex < quizQuestions.length - 1 ? "Next question →" : "See quiz results"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Complete Screen */
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card flex flex-col items-center">
              <Owl size={96} mood={quizScore >= 4 ? "celebrate" : "idle"} />
              <h2 className="mt-4 text-2xl font-medium text-ink">Quiz complete!</h2>
              <p className="mt-1 text-sm text-muted">
                You scored <span className="font-semibold text-ink tabular-nums">{quizScore}</span> out of{" "}
                <span className="tabular-nums">{quizQuestions.length}</span> questions correct.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button onClick={resetQuiz}>Play another round</Button>
                <Button variant="secondary" onClick={() => setMode("flashcards")}>
                  Return to flashcards
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
