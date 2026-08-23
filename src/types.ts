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

export type AppState = {
  progress: Record<number, WordProgress>;
  streak: number;
  lastStudyDate: string | null;
  todayCount: number;
  todayDate: string | null;
  goal: number;
  settings: Settings;
  onboarded: boolean;
  lastUnit: number | null;
  studyDays: string[];
};

export type Route =
  | { name: "home" }
  | { name: "study"; unit?: number; mode?: "due" | "unit" }
  | { name: "quiz"; unit?: number }
  | { name: "list"; unit?: number }
  | { name: "stats" };

export const PARTS = [
  { id: 1 as const, label: "基礎", subtitle: "1–800", score: "常に出る" },
  { id: 2 as const, label: "必修", subtitle: "801–1500", score: "重要語" },
  { id: 3 as const, label: "発展", subtitle: "1501–1900", score: "差がつく" },
];
