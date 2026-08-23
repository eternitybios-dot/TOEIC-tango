import type { Pos, Word } from "../types";
import { WORDS } from "../data";

export type MeaningNote = {
  gloss: string;
  lines: string[];
};

const ROLE: Record<Pos, string> = {
  名: "もの・こと",
  動: "動き",
  形: "性質",
  副: "様子",
  前: "関係",
  接: "つなぎ",
  句: "かたまり",
};

const BY_MEANING = new Map<string, Word[]>();
for (const item of WORDS) {
  const list = BY_MEANING.get(item.meaning) ?? [];
  list.push(item);
  BY_MEANING.set(item.meaning, list);
}

function nearWords(word: Word): Word[] {
  return (BY_MEANING.get(word.meaning) ?? []).filter((item) => item.id !== word.id).slice(0, 2);
}

export function explainMeaning(word: Word): MeaningNote {
  const lines = [`${ROLE[word.pos]}を表す。核は「${word.meaning}」。`];

  const similar = nearWords(word);
  if (similar.length > 0) {
    lines.push(`近い訳: ${similar.map((item) => item.word).join("・")}。`);
  }

  return { gloss: word.meaning, lines };
}
