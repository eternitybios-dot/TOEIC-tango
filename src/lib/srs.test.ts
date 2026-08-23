import { describe, expect, it } from "vitest";
import { WORDS } from "../data";
import { afterAgain, afterGood, clozePhrase, phraseParts, pickChoices, takeSession } from "./quiz";
import { dealQuiz } from "./session";
import { emptyProgress, masteryOf, recordQuiz, review } from "./srs";
import { defaultState } from "./storage";
import { hashToRoute, routeToHash } from "./route";

describe("word data", () => {
  it("has unique ids and unique headwords", () => {
    const ids = WORDS.map((w) => w.id);
    const words = WORDS.map((w) => w.word.toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(words).size).toBe(words.length);
  });

  it("has 1900 unique words across 19 Target-style units", () => {
    const units = new Set(WORDS.map((w) => w.unit));
    const parts = new Set(WORDS.map((w) => w.part));
    expect(units.size).toBe(19);
    expect(parts.size).toBe(3);
    expect(WORDS.length).toBe(1900);
    expect(WORDS.every((w) => w.phrase && w.phraseJa)).toBe(true);
  });
});

describe("srs", () => {
  it("treats unseen words as new and due", () => {
    expect(masteryOf(undefined)).toBe("new");
    const first = review(emptyProgress(), "good");
    expect(first.repetitions).toBe(1);
    expect(first.interval).toBe(1);
    expect(first.correct).toBe(1);
  });

  it("resets repetitions on again", () => {
    let p = review(emptyProgress(), "good");
    p = review(p, "good");
    p = review(p, "again");
    expect(p.repetitions).toBe(0);
    expect(p.wrong).toBe(1);
  });
});

describe("quiz", () => {
  it("returns four unique choices including the correct word", () => {
    const correct = WORDS[0];
    const choices = pickChoices(correct, WORDS, 4);
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
    expect(choices.some((c) => c.id === correct.id)).toBe(true);
  });

  it("uses short phrases rather than a single headword", () => {
    const sample = WORDS.slice(0, 80);
    expect(sample.every((w) => w.phrase.trim().includes(" "))).toBe(true);
    expect(sample.every((w) => w.phraseJa.trim().length > 1)).toBe(true);
  });

  it("keeps a missed card in the session and removes a known card", () => {
    const [a, b, c, d] = WORDS;
    const again = afterAgain([a, b, c, d], 0, 2);
    expect(again.finished).toBe(false);
    expect(again.queue.map((w) => w.id)).toEqual([b.id, c.id, a.id, d.id]);
    expect(again.queue[again.index].id).toBe(b.id);

    const good = afterGood([a, b, c], 0);
    expect(good.queue.map((w) => w.id)).toEqual([b.id, c.id]);
    expect(afterGood([a], 0).finished).toBe(true);
  });

  it("keeps due order when taking a session", () => {
    const [a, b, c] = WORDS;
    expect(takeSession([a, b, c], 2).map((w) => w.id)).toEqual([a.id, b.id]);
  });

  it("deals a random quiz of unique words from the pool", () => {
    const pool = WORDS.slice(0, 40);
    const dealt = dealQuiz(defaultState(), pool, "random");
    expect(dealt).toHaveLength(10);
    expect(new Set(dealt.map((word) => word.id)).size).toBe(10);
    expect(dealt.every((word) => pool.some((item) => item.id === word.id))).toBe(true);
  });

  it("fills a due quiz with unseen words when nothing is due", () => {
    const pool = WORDS.slice(0, 40);
    const dealt = dealQuiz(defaultState(), pool, "due");
    expect(dealt).toHaveLength(10);
    expect(dealt.every((word) => pool.some((item) => item.id === word.id))).toBe(true);
  });

  it("blanks the headword for cloze prompts", () => {
    const word = WORDS.find((item) => item.word === "abandon");
    expect(word).toBeTruthy();
    expect(clozePhrase(word!)).toMatch(/______/);
    expect(clozePhrase(word!).toLowerCase().includes("abandon")).toBe(false);
    expect(phraseParts(word!).some((part) => part.hit && part.text.toLowerCase() === "abandon")).toBe(true);
  });

  it("never leaves the answer word in a cloze prompt", () => {
    for (const word of WORDS) {
      const prompt = clozePhrase(word).toLowerCase();
      expect(prompt).toMatch(/______/);
      expect(prompt.includes(word.word.toLowerCase())).toBe(false);
    }
  });
});

describe("quiz vs card srs", () => {
  it("does not advance the interval on a correct quiz guess", () => {
    const learned = review(emptyProgress(), "good");
    const afterQuiz = recordQuiz(learned, true);
    expect(afterQuiz.interval).toBe(learned.interval);
    expect(afterQuiz.nextReview).toBe(learned.nextReview);
    expect(afterQuiz.repetitions).toBe(learned.repetitions);
    expect(afterQuiz.correct).toBe(learned.correct + 1);
  });

  it("makes a missed quiz word due again soon", () => {
    const learned = review(emptyProgress(), "good");
    const missed = recordQuiz(learned, false);
    expect(missed.repetitions).toBe(0);
    expect(missed.wrong).toBe(1);
    expect(missed.nextReview).toBeLessThan(learned.nextReview);
  });
});

describe("routes", () => {
  it("round-trips study and quiz hashes", () => {
    expect(hashToRoute("#/study/3")).toEqual({ name: "study", mode: "unit", unit: 3 });
    expect(routeToHash({ name: "quiz" })).toBe("#/quiz");
    expect(routeToHash({ name: "quiz", part: 2 })).toBe("#/quiz/part/2");
    expect(hashToRoute("#/quiz/part/1")).toEqual({ name: "quiz", part: 1 });
    expect(hashToRoute("")).toEqual({ name: "home" });
  });
});
