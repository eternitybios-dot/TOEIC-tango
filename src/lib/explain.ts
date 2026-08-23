import type { Word } from "../types";
import { WORDS } from "../data";
import { buildLearnerNote } from "./note";

export type MeaningNote = {
  gloss: string;
  lines: string[];
};

function nearWords(word: Word, source: Word[]): Word[] {
  return source.filter((item) => item.id !== word.id && item.meaning === word.meaning).slice(0, 2);
}

export function explainMeaning(word: Word, source: Word[] = WORDS): MeaningNote {
  const main = (word.note && word.note.trim()) || buildLearnerNote(word);
  const lines = [main];

  const similar = nearWords(word, source);
  if (similar.length > 0) {
    lines.push(`類語：${similar.map((item) => item.word).join(" / ")}。`);
  }

  return { gloss: word.meaning, lines };
}
