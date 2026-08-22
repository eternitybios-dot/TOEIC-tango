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

const ABOUT: Record<Exclude<Pos, "名">, (partner: string) => string> = {
  動: (p) => `${p}などを対象にする。`,
  形: (p) => `${p}を説明する。`,
  副: (p) => `${p}の条件・様子を足す。`,
  前: (p) => `${p}との関係を示す。`,
  接: (p) => `${p}をつなぐ。`,
  句: (p) => `${p}のかたまり。`,
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

function partnerJa(word: Word): string | null {
  const gloss = word.meaning.replace(/^[〜～]/, "");
  let ja = word.phraseJa;
  if (ja.includes(word.meaning)) ja = ja.split(word.meaning).join("");
  else if (gloss && ja.includes(gloss)) ja = ja.split(gloss).join("");
  ja = ja.replace(/[をにでとがのはも、。]+/g, " ").replace(/\s+/g, " ").trim();
  if (ja.length < 2 || ja === word.meaning || ja === gloss) return null;
  return ja;
}

export function explainMeaning(word: Word): MeaningNote {
  const lines = [`${ROLE[word.pos]}を表す。核は「${word.meaning}」。`];

  const partner = partnerJa(word);
  if (partner) {
    if (word.pos === "名") lines.push(`${partner}に関する「${word.meaning}」。`);
    else lines.push(ABOUT[word.pos](partner));
  }

  const similar = nearWords(word);
  if (similar.length > 0) {
    lines.push(`近い訳: ${similar.map((item) => item.word).join("・")}。`);
  }

  return { gloss: word.meaning, lines };
}
