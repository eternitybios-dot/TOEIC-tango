import { describe, expect, it } from "vitest";
import { WORDS } from "../data";
import { catalog } from "./catalog";
import { explainMeaning } from "./explain";
import { buildLearnerNote } from "./note";

const ALL = [...catalog("toeic").words, ...catalog("business").words, ...catalog("travel").words];

describe("explainMeaning", () => {
  it("explains the gloss only, not leftover example words", () => {
    for (const word of WORDS) {
      const note = explainMeaning(word);
      const text = note.lines.join("");
      expect(note.gloss).toBe(word.meaning);
      expect(note.lines.length).toBeGreaterThanOrEqual(1);
      expect(note.lines.length).toBeLessThanOrEqual(2);
      expect(text.includes("核は")).toBe(false);
      expect(text.includes("近い訳")).toBe(false);
      expect(text.includes("を説明する")).toBe(false);
      expect(text.includes("を対象にする")).toBe(false);
      expect(text.includes("のときが")).toBe(false);
      expect(text.includes("正解のフレーズ")).toBe(false);
      expect(text.includes("人や物の性質・状態を表す")).toBe(false);
      expect(text.includes("動作や状態の変化を表して用いる")).toBe(false);
      expect(text.includes("人・物・事を指して用いる")).toBe(false);
    }
  });

  it("does not turn the example phrase into a fake definition", () => {
    const absolute = WORDS.find((word) => word.word === "absolute");
    expect(absolute).toBeTruthy();
    const text = explainMeaning(absolute!).lines.join("");
    expect(text).not.toContain("確信");
    expect(text).toMatch(/absolute/i);
    expect(text).not.toBe("形容詞。「絶対的な」の意。人や物の性質・状態を表す。");
  });

  it("lists same-gloss words as 類語 in exam-book style", () => {
    const withTwin = WORDS.find((word) => WORDS.some((other) => other.id !== word.id && other.meaning === word.meaning));
    expect(withTwin).toBeTruthy();
    const text = explainMeaning(withTwin!).lines.join("");
    expect(text.includes("類語：")).toBe(true);
  });

  it("avoids recycled template phrases", () => {
    const banned = [
      "とセットで覚える",
      "フォーマルな他動詞になりやすい",
      "のあとに対象",
      "結びつきやすい",
      "を指す名詞",
      "分解せずこの語順で覚える",
      "補語に置く",
      "人や物の性質・状態を表す",
    ];
    for (const word of ALL) {
      const text = word.note?.trim() || buildLearnerNote(word);
      for (const phrase of banned) {
        expect(text.includes(phrase), `${word.word}: ${phrase} in ${text}`).toBe(false);
      }
    }
  });

  it("gives each word its own learner note", () => {
    const rows = ALL.map((word) => ({ word, note: word.note?.trim() || buildLearnerNote(word) }));
    const tooShort = rows.filter((row) => row.note.length < 12).map((row) => `${row.word.word}:${row.note}`);
    const tooLong = rows.filter((row) => row.note.length > 96).map((row) => `${row.word.id}:${row.note.length}:${row.note}`);
    const seen = new Map<string, string[]>();
    for (const row of rows) {
      const list = seen.get(row.note) ?? [];
      list.push(`${row.word.id}:${row.word.word}`);
      seen.set(row.note, list);
    }
    const collisions = [...seen.entries()].filter(([, list]) => list.length > 1);
    expect(tooShort, tooShort.join(" | ")).toEqual([]);
    expect(tooLong, tooLong.join(" | ")).toEqual([]);
    expect(collisions, collisions.map(([note, list]) => `${list.join(" & ")} => ${note}`).join("\n")).toEqual([]);
  });
});
