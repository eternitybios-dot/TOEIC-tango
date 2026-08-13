import type { Word } from "../types";
import { part1 } from "./part1";
import { part2 } from "./part2";
import { part3 } from "./part3";
import { part4 } from "./part4";

export const WORDS: Word[] = [...part1, ...part2, ...part3, ...part4];

export const UNITS = [...new Set(WORDS.map((w) => w.unit))].sort((a, b) => a - b);

export const UNIT_META: Record<number, { title: string; part: Word["part"] }> = {
  1: { title: "基礎動詞・基本語 A", part: 1 },
  2: { title: "基礎動詞・基本語 B", part: 1 },
  3: { title: "必修：社会・仕事", part: 2 },
  4: { title: "必修：思考・関係", part: 2 },
  5: { title: "必修：判断・協力", part: 2 },
  6: { title: "発展：危機・変化", part: 3 },
  7: { title: "発展：分析・区別", part: 3 },
  8: { title: "TOEIC：取引・移動", part: 4 },
  9: { title: "TOEIC：人事・会議", part: 4 },
  10: { title: "TOEIC：評価・形容詞", part: 4 },
};

export function wordsByUnit(unit: number): Word[] {
  return WORDS.filter((w) => w.unit === unit);
}

export function wordsByPart(part: Word["part"]): Word[] {
  return WORDS.filter((w) => w.part === part);
}

export function getWord(id: number): Word | undefined {
  return WORDS.find((w) => w.id === id);
}
