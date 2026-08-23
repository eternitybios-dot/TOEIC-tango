import type { AppState, Word } from "../types";
import { pickSession, takeSession } from "./quiz";
import { getProgress } from "./storage";
import { isDue } from "./srs";
import { studyQueue } from "./stats";

export const SESSION_SIZE = 10;

export type QuizMix = "due" | "random";

export function dealSession(state: AppState, source: Word[]): Word[] {
  return takeSession(studyQueue(state, source), SESSION_SIZE);
}

export function dealQuiz(state: AppState, source: Word[], mix: QuizMix, now = Date.now()): Word[] {
  if (source.length === 0) return [];
  if (mix === "random") return pickSession(source, SESSION_SIZE);

  const due: Word[] = [];
  const fresh: Word[] = [];
  for (const word of source) {
    const progress = getProgress(state, word.id);
    if (progress.seen === 0) fresh.push(word);
    else if (isDue(progress, now)) due.push(word);
  }
  if (due.length === 0 && fresh.length === 0) return pickSession(source, SESSION_SIZE);
  if (due.length >= SESSION_SIZE) return pickSession(due, SESSION_SIZE);
  return [...pickSession(due, due.length), ...pickSession(fresh, SESSION_SIZE - due.length)];
}
