import { describe, expect, it } from "vitest";
import { WORDS } from "../data";
import { pickChoices } from "./quiz";
import { emptyProgress, masteryOf, review } from "./srs";

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
});
