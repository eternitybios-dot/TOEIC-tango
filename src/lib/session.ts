import type { AppState, Word } from "../types";
import { takeSession } from "./quiz";
import { studyQueue } from "./stats";

export const SESSION_SIZE = 10;

export function dealSession(state: AppState, source: Word[]): Word[] {
  return takeSession(studyQueue(state, source), SESSION_SIZE);
}
