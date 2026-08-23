import type { DeckId, PartInfo, Word } from "../types";
import { PARTS } from "../types";
import toeic from "../data/words.json";
import business from "../data/business.json";
import travel from "../data/travel.json";

export type DeckMeta = {
  id: DeckId;
  label: string;
  kicker: string;
  title: string;
  blurb: string;
};

export const DECK_LIST: DeckMeta[] = [
  { id: "toeic", label: "TOEIC", kicker: "試験対策", title: "受験頻出 1900", blurb: "試験でよく出る語" },
  { id: "business", label: "ビジネス", kicker: "仕事の英語", title: "ビジネス英単語", blurb: "会議・メール・取引" },
  { id: "travel", label: "日常・旅行", kicker: "会話で使う", title: "日常・旅行英単語", blurb: "街・生活・会話" },
];

const WORDS: Record<DeckId, Word[]> = {
  toeic: toeic as Word[],
  business: business as Word[],
  travel: travel as Word[],
};

export type Catalog = {
  deck: DeckId;
  meta: DeckMeta;
  words: Word[];
  units: number[];
  unitMeta: Record<number, { title: string; part: Word["part"] }>;
  parts: PartInfo[];
  wordsByUnit: (unit: number) => Word[];
  wordsByPart: (part: Word["part"]) => Word[];
  getWord: (id: number) => Word | undefined;
};

function partsFor(deck: DeckId, words: Word[]): PartInfo[] {
  if (deck === "toeic") return PARTS;
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const word of words) counts[word.part] += 1;
  const labels: Record<1 | 2 | 3, { label: string; score: string }> =
    deck === "business"
      ? {
          1: { label: "会議", score: "打ち合わせ" },
          2: { label: "文書", score: "メール" },
          3: { label: "取引", score: "数字" },
        }
      : {
          1: { label: "移動", score: "空港・交通" },
          2: { label: "滞在", score: "宿・食事" },
          3: { label: "会話", score: "生活・仕事" },
        };
  return ([1, 2, 3] as const)
    .filter((id) => counts[id] > 0)
    .map((id) => ({
      id,
      label: labels[id].label,
      subtitle: `${counts[id]}語`,
      score: labels[id].score,
    }));
}

export function catalog(deck: DeckId): Catalog {
  const words = WORDS[deck] ?? WORDS.toeic;
  const units = [...new Set(words.map((word) => word.unit))].sort((a, b) => a - b);
  const parts = partsFor(deck, words);
  const unitMeta = Object.fromEntries(
    units.map((unit) => {
      const inUnit = words.filter((word) => word.unit === unit);
      const part = inUnit[0]?.part ?? 1;
      const label = parts.find((item) => item.id === part)?.label ?? `${inUnit.length}語`;
      const travelUnit: Record<number, string> = {
        1: "移動",
        2: "滞在",
        3: "会話",
        4: "生活",
        5: "日常会話",
      };
      const title =
        deck === "toeic"
          ? `${label} ${(unit - 1) * 100 + 1}–${Math.min(unit * 100, words.length)}`
          : deck === "travel"
            ? `${travelUnit[unit] ?? label} ${inUnit.length}語`
            : `${label} ${inUnit.length}語`;
      return [unit, { title, part }];
    }),
  ) as Catalog["unitMeta"];

  return {
    deck,
    meta: DECK_LIST.find((item) => item.id === deck) ?? DECK_LIST[0],
    words,
    units,
    unitMeta,
    parts,
    wordsByUnit: (unit) => words.filter((word) => word.unit === unit),
    wordsByPart: (part) => words.filter((word) => word.part === part),
    getWord: (id) => words.find((word) => word.id === id),
  };
}

export function deckMeta(id: DeckId): DeckMeta {
  return DECK_LIST.find((item) => item.id === id) ?? DECK_LIST[0];
}
