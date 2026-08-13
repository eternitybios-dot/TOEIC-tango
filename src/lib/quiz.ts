import type { Word } from "../types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickChoices(correct: Word, pool: Word[], count = 4): Word[] {
  const others = pool.filter((w) => w.id !== correct.id && w.pos === correct.pos);
  const fallback = pool.filter((w) => w.id !== correct.id);
  const source = others.length >= count - 1 ? others : fallback;
  const distractors = shuffle(source).slice(0, count - 1);
  return shuffle([correct, ...distractors]);
}

export function pickSession(pool: Word[], size: number): Word[] {
  return shuffle(pool).slice(0, Math.min(size, pool.length));
}

export { shuffle };
