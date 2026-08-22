import { describe, expect, it } from "vitest";
import { WORDS } from "../data";
import { explainMeaning } from "./explain";

describe("explainMeaning", () => {
  it("builds a long meaning-only note for every word", () => {
    for (const word of WORDS) {
      const note = explainMeaning(word);
      const text = note.sections.map((section) => section.body).join("");
      expect(note.gloss).toBe(word.meaning);
      expect(text.includes(word.meaning)).toBe(true);
      expect(text.includes(word.word)).toBe(true);
      expect(text.length).toBeGreaterThan(180);
      expect(text.includes("正解のフレーズ")).toBe(false);
    }
  });

  it("mentions nearby words that share a gloss", () => {
    const abandon = WORDS.find((word) => word.word === "abandon");
    expect(abandon).toBeTruthy();
    const note = explainMeaning(abandon!);
    expect(note.sections.map((section) => section.title)).toEqual([
      "核の意味",
      "詳しく",
      "文の中での働き",
      "試験での捉え方",
    ]);
  });
});
