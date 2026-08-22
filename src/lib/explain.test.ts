import { describe, expect, it } from "vitest";
import { WORDS } from "../data";
import { explainMeaning } from "./explain";

describe("explainMeaning", () => {
  it("gives a short meaning note for every word", () => {
    for (const word of WORDS) {
      const note = explainMeaning(word);
      const text = note.lines.join("");
      expect(note.gloss).toBe(word.meaning);
      expect(note.lines.length).toBeGreaterThanOrEqual(1);
      expect(note.lines.length).toBeLessThanOrEqual(3);
      expect(text.includes(word.meaning)).toBe(true);
      expect(text.includes("のときが")).toBe(false);
      expect(text.includes("正解のフレーズ")).toBe(false);
      expect(text.length).toBeLessThan(90);
    }
  });

  it("adds a compact about-line without rambling", () => {
    const abandon = WORDS.find((word) => word.word === "abandon");
    expect(abandon).toBeTruthy();
    expect(explainMeaning(abandon!).lines).toEqual([
      "動きを表す。核は「放棄する」。",
      "計画などを対象にする。",
    ]);
  });
});
