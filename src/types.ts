export type Pos = "名" | "動" | "形" | "副" | "前" | "接" | "句";

export const POS_LABEL: Record<Pos, string> = {
  名: "名詞",
  動: "動詞",
  形: "形容詞",
  副: "副詞",
  前: "前置詞",
  接: "接続詞",
  句: "句",
};

export type Word = {
  id: number;
  word: string;
  ipa: string;
  pos: Pos;
  meaning: string;
  phrase: string;
  phraseJa: string;
  part: 1 | 2 | 3;
  unit: number;
  /** Short learner note shown on the card back. Unique per word. */
  note?: string;
};

export type Mastery = "new" | "learning" | "reviewing" | "mastered";

export type WordProgress = {
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastResult: "again" | "good" | null;
  seen: number;
  correct: number;
  wrong: number;
};

export type Settings = {
  sound: boolean;
  haptics: boolean;
  autoSpeak: boolean;
};

export type DeckId = "toeic" | "business" | "travel";

export type SessionScope = { type: "all" } | { type: "part"; part: 1 | 2 | 3 } | { type: "unit"; unit: number };

export type SavedSession = {
  kind: "study" | "quiz";
  deck: DeckId;
  mix: "due" | "random" | "missed";
  size: number;
  scope: SessionScope;
  queue: number[];
  index: number;
  seen: number[];
  good: number;
  again: number;
  score: number;
  missed: number[];
  quizMode: "en-ja" | "ja-en" | "cloze";
  sessionLen: number;
};

export type AppState = {
  deck: DeckId;
  progress: Record<number, WordProgress>;
  progressByDeck: Record<DeckId, Record<number, WordProgress>>;
  streak: number;
  lastStudyDate: string | null;
  todayCount: number;
  todayDate: string | null;
  goal: number;
  settings: Settings;
  onboarded: boolean;
  lastUnit: number | null;
  lastUnitByDeck: Record<DeckId, number | null>;
  studyDays: string[];
  resume: { study: SavedSession | null; quiz: SavedSession | null };
};

export type Route =
  | { name: "home" }
  | { name: "study"; unit?: number; part?: 1 | 2 | 3; mode?: "due" | "unit" | "missed" }
  | { name: "quiz"; unit?: number; part?: 1 | 2 | 3 }
  | { name: "list"; unit?: number }
  | { name: "stats" };

export type PartInfo = { id: 1 | 2 | 3; label: string; subtitle: string; score: string };

export const PARTS: PartInfo[] = [
  { id: 1, label: "基礎", subtitle: "1–800", score: "常に出る" },
  { id: 2, label: "必修", subtitle: "801–1500", score: "重要語" },
  { id: 3, label: "発展", subtitle: "1501–2000", score: "差がつく" },
];
