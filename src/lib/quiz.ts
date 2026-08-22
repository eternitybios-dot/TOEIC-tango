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

/** Keep the incoming order so due words stay first. */
export function takeSession(pool: Word[], size: number): Word[] {
  return pool.slice(0, Math.min(size, pool.length));
}

export function clozePhrase(word: Word): string {
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blanked = word.phrase.replace(new RegExp(`\\b${escaped}\\b`, "i"), "______");
  return blanked === word.phrase ? `______ ${word.phrase}` : blanked;
}

export function phraseParts(word: Word): { text: string; hit: boolean }[] {
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\b${escaped}\\b)`, "i");
  return word.phrase.split(re).filter(Boolean).map((text) => ({
    text,
    hit: text.toLowerCase() === word.word.toLowerCase(),
  }));
}

export function afterGood(
  queue: Word[],
  index: number,
): { queue: Word[]; index: number; finished: boolean } {
  const next = queue.filter((_, i) => i !== index);
  if (next.length === 0) return { queue: next, index: 0, finished: true };
  return { queue: next, index: Math.min(index, next.length - 1), finished: false };
}

/** Put the current card a few spots later so it comes back this session. */
export function afterAgain(
  queue: Word[],
  index: number,
  delay = 2,
): { queue: Word[]; index: number; finished: boolean } {
  const current = queue[index];
  const without = queue.filter((_, i) => i !== index);
  if (!current) return { queue, index, finished: queue.length === 0 };
  if (without.length === 0) return { queue: [current], index: 0, finished: false };
  const pos = Math.min(index + delay, without.length);
  return {
    queue: [...without.slice(0, pos), current, ...without.slice(pos)],
    index: index < without.length ? index : 0,
    finished: false,
  };
}

export { shuffle };
