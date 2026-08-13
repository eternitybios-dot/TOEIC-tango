export type Pos = "名" | "動" | "形" | "副" | "前" | "接" | "句";

export type Word = {
  id: number;
  word: string;
  ipa: string;
  pos: Pos;
  meaning: string;
  example: string;
  exampleJa: string;
  part: 1 | 2 | 3 | 4;
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

export type AppState = {
  progress: Record<number, WordProgress>;
  streak: number;
  lastStudyDate: string | null;
  todayCount: number;
  todayDate: string | null;
  goal: number;
};

export type Route =
  | { name: "home" }
  | { name: "study"; unit?: number; mode?: "due" | "unit" }
  | { name: "quiz"; unit?: number }
  | { name: "list"; unit?: number }
  | { name: "stats" };

export const PARTS = [
  { id: 1 as const, label: "基礎", subtitle: "Target 序盤帯", score: "〜600" },
  { id: 2 as const, label: "必修", subtitle: "Target 中盤帯", score: "〜730" },
  { id: 3 as const, label: "発展", subtitle: "Target 終盤帯", score: "〜860" },
  { id: 4 as const, label: "ビジネス", subtitle: "TOEIC 頻出", score: "〜990" },
];
