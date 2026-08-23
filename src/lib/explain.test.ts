import { describe, expect, it } from "vitest";
import { WORDS } from "../data";
import { POS_LABEL } from "../types";
import { explainMeaning } from "./explain";

describe("explainMeaning", () => {
  it("explains the gloss only, not leftover example words", () => {
    for (const word of WORDS) {
      const note = explainMeaning(word);
      const text = note.lines.join("");
      expect(note.gloss).toBe(word.meaning);
      expect(note.lines.length).toBeGreaterThanOrEqual(1);
      expect(note.lines.length).toBeLessThanOrEqual(2);
      expect(text.includes(word.meaning)).toBe(true);
      expect(text.includes(POS_LABEL[word.pos])).toBe(true);
      expect(text.includes("の意")).toBe(true);
      expect(text.includes("核は")).toBe(false);
      expect(text.includes("近い訳")).toBe(false);
      expect(text.includes("を説明する")).toBe(false);
      expect(text.includes("を対象にする")).toBe(false);
      expect(text.includes("のときが")).toBe(false);
      expect(text.includes("正解のフレーズ")).toBe(false);
    }
  });

  it("does not turn the example phrase into a fake definition", () => {
    const absolute = WORDS.find((word) => word.word === "absolute");
    expect(absolute).toBeTruthy();
    expect(explainMeaning(absolute!).lines.join("")).not.toContain("確信");
    expect(explainMeaning(absolute!).lines).toEqual(["形容詞。「絶対的な」の意。人や物の性質・状態を表す。"]);
  });

  it("lists same-gloss words as 類語 in exam-book style", () => {
    const withTwin = WORDS.find((word) => WORDS.some((other) => other.id !== word.id && other.meaning === word.meaning));
    expect(withTwin).toBeTruthy();
    const text = explainMeaning(withTwin!).lines.join("");
    expect(text.includes("類語：")).toBe(true);
  });
});
