import type { AppState, WordProgress } from "../types";
import { emptyProgress } from "./srs";

const KEY = "toeic-tango-v2";

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function defaultState(): AppState {
  return {
    progress: {},
    streak: 0,
    lastStudyDate: null,
    todayCount: 0,
    todayDate: null,
    goal: 20,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    return { ...defaultState(), ...parsed, progress: parsed.progress ?? {} };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getProgress(state: AppState, id: number): WordProgress {
  return state.progress[id] ?? emptyProgress();
}

export function withStudyTick(state: AppState, now = new Date()): AppState {
  const today = todayKey(now);
  let { streak, lastStudyDate, todayCount, todayDate } = state;

  if (todayDate !== today) {
    todayCount = 0;
    todayDate = today;
  }

  if (lastStudyDate !== today) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    streak = lastStudyDate === todayKey(yesterday) ? streak + 1 : 1;
    lastStudyDate = today;
  }

  return { ...state, streak, lastStudyDate, todayCount: todayCount + 1, todayDate };
}
