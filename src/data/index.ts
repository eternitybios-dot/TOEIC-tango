import type { Word } from "../types";
import raw from "./words.json";

export const WORDS = raw as Word[];

export const UNITS = [...new Set(WORDS.map((w) => w.unit))].sort((a, b) => a - b);

export const UNIT_META: Record<number, { title: string; part: Word["part"] }> = Object.fromEntries(
  UNITS.map((unit) => {
    const start = (unit - 1) * 100 + 1;
    const end = Math.min(unit * 100, WORDS.length);
    const part: Word["part"] = unit <= 8 ? 1 : unit <= 15 ? 2 : 3;
    const band = part === 1 ? "基礎" : part === 2 ? "必修" : "発展";
    return [unit, { title: `${band} ${start}–${end}`, part }];
  }),
);

export function wordsByUnit(unit: number): Word[] {
  return WORDS.filter((w) => w.unit === unit);
}

export function wordsByPart(part: Word["part"]): Word[] {
  return WORDS.filter((w) => w.part === part);
}

export function getWord(id: number): Word | undefined {
  return WORDS.find((w) => w.id === id);
}
