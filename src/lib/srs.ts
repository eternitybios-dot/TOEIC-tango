import type { WordProgress } from "../types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export function emptyProgress(): WordProgress {
  return {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastResult: null,
    seen: 0,
    correct: 0,
    wrong: 0,
  };
}

export function isDue(progress: WordProgress | undefined, now = Date.now()): boolean {
  if (!progress || progress.seen === 0) return true;
  return progress.nextReview <= now;
}

export function masteryOf(progress: WordProgress | undefined): "new" | "learning" | "reviewing" | "mastered" {
  if (!progress || progress.seen === 0) return "new";
  if (progress.repetitions >= 4 && progress.interval >= 14) return "mastered";
  if (progress.repetitions >= 2) return "reviewing";
  return "learning";
}

/** Simplified SM-2: again resets, good advances. */
export function review(
  progress: WordProgress,
  result: "again" | "good",
  now = Date.now(),
): WordProgress {
  const next: WordProgress = {
    ...progress,
    seen: progress.seen + 1,
    lastResult: result,
    correct: progress.correct + (result === "good" ? 1 : 0),
    wrong: progress.wrong + (result === "again" ? 1 : 0),
  };

  if (result === "again") {
    next.repetitions = 0;
    next.interval = 0;
    next.ease = Math.max(1.3, progress.ease - 0.2);
    next.nextReview = now + 10 * MINUTE;
    return next;
  }

  const ease = Math.min(3.0, progress.ease + 0.05);
  const repetitions = progress.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 3;
  else intervalDays = Math.round(Math.max(1, progress.interval) * ease);

  next.ease = ease;
  next.repetitions = repetitions;
  next.interval = intervalDays;
  next.nextReview = now + intervalDays * DAY;
  return next;
}
