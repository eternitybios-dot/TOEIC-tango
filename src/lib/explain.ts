import type { Pos, Word } from "../types";
import { POS_LABEL } from "../types";
import { WORDS } from "../data";

export type MeaningNote = {
  gloss: string;
  lines: string[];
};

const POS_NOTE: Record<Pos, string> = {
  名: "人・物・事を指して用いる。",
  動: "動作や状態の変化を表して用いる。",
  形: "人や物の性質・状態を表す。",
  副: "動詞や形容詞を修飾して用いる。",
  前: "名詞の前に置いて、あとの語との関係を示す。",
  接: "語や文をつないで用いる。",
  句: "ひとまとまりの表現として覚える。",
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
  const lines = [`${POS_LABEL[word.pos]}。「${word.meaning}」の意。${POS_NOTE[word.pos]}`];

  const similar = nearWords(word);
  if (similar.length > 0) {
    lines.push(`類語：${similar.map((item) => item.word).join(" / ")}。`);
  }

  return { gloss: word.meaning, lines };
}
