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

  it("covers ten units across four parts", () => {
    const units = new Set(WORDS.map((w) => w.unit));
    const parts = new Set(WORDS.map((w) => w.part));
    expect(units.size).toBe(10);
    expect(parts.size).toBe(4);
    expect(WORDS.length).toBeGreaterThanOrEqual(400);
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
});
