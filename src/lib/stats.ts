import type { AppState, Word } from "../types";
import { getProgress } from "./storage";
import { isDue, masteryOf } from "./srs";

export function summarize(state: AppState, words: Word[], now = Date.now()) {
  const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0, due: 0, seen: 0 };
  for (const word of words) {
    const progress = getProgress(state, word.id);
    counts[masteryOf(progress)] += 1;
    if (progress.seen > 0) counts.seen += 1;
    if (isDue(progress, now)) counts.due += 1;
  }
  return counts;
}

export function dueThenNew(state: AppState, words: Word[], now = Date.now()): Word[] {
  const due: Word[] = [];
  const fresh: Word[] = [];
  for (const word of words) {
    const progress = getProgress(state, word.id);
    if (progress.seen === 0) fresh.push(word);
    else if (isDue(progress, now)) due.push(word);
  }
  return [...due, ...fresh];
}

export type Counts = ReturnType<typeof summarize>;

function emptyCounts(): Counts {
  return { new: 0, learning: 0, reviewing: 0, mastered: 0, due: 0, seen: 0 };
}

function bump(counts: Counts, state: AppState, word: Word, now: number) {
  const progress = getProgress(state, word.id);
  counts[masteryOf(progress)] += 1;
  if (progress.seen > 0) counts.seen += 1;
  if (isDue(progress, now)) counts.due += 1;
}

export function dashboard(state: AppState, words: Word[], now = Date.now()) {
  const all = emptyCounts();
  const parts: Record<1 | 2 | 3, Counts> = {
    1: emptyCounts(),
    2: emptyCounts(),
    3: emptyCounts(),
  };
  const units: Record<number, Counts> = {};

  for (const word of words) {
    bump(all, state, word, now);
    bump(parts[word.part], state, word, now);
    units[word.unit] ??= emptyCounts();
    bump(units[word.unit], state, word, now);
  }

  return { all, parts, units };
}

export function studyQueue(state: AppState, words: Word[], now = Date.now()): Word[] {
  return dueThenNew(state, words, now);
}
