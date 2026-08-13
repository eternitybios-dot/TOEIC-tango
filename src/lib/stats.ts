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
