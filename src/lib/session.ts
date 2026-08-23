import type { AppState, Word } from "../types";
import { pickSession, takeSession } from "./quiz";
import { getProgress } from "./storage";
import { isDue } from "./srs";
import { studyQueue } from "./stats";

export const SESSION_SIZE = 100;
export const SHORT_SESSION = 10;

export type QuizMix = "due" | "random" | "missed";

export function mixLabel(mix: QuizMix): string {
  if (mix === "random") return "ランダム";
  if (mix === "missed") return "集中";
  return "覚える";
}

export function mixNote(mix: QuizMix, missedCount: number): string {
  if (mix === "random") return "毎回ちがう語";
  if (mix === "missed") {
    return missedCount === 0
      ? "もう一度・不正解の語はまだありません"
      : `もう一度・不正解の ${missedCount} 語`;
  }
  return "未学習と期限から";
}

export function listMissed(state: AppState, source: Word[]): Word[] {
  return source.filter((word) => {
    const progress = getProgress(state, word.id);
    return progress.lastResult === "again" || progress.wrong > 0;
  });
}

export function dealSession(state: AppState, source: Word[], size = SESSION_SIZE): Word[] {
  return takeSession(studyQueue(state, source), size);
}

export function dealQuiz(
  state: AppState,
  source: Word[],
  mix: QuizMix,
  now = Date.now(),
  size = SESSION_SIZE,
): Word[] {
  if (source.length === 0) return [];
  const take = Math.max(1, size);
  if (mix === "random") return pickSession(source, take);
  if (mix === "missed") {
    const missed = listMissed(state, source);
    return missed.length === 0 ? [] : pickSession(missed, take);
  }

  const due: Word[] = [];
  const fresh: Word[] = [];
  for (const word of source) {
    const progress = getProgress(state, word.id);
    if (progress.seen === 0) fresh.push(word);
    else if (isDue(progress, now)) due.push(word);
  }
  if (due.length === 0 && fresh.length === 0) return pickSession(source, take);
  if (due.length >= take) return pickSession(due, take);
  return [...pickSession(due, due.length), ...pickSession(fresh, take - due.length)];
}
