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
    settings: { sound: true, haptics: true, autoSpeak: true },
    onboarded: false,
    lastUnit: null,
    studyDays: [],
  };
}

export function normalizeState(parsed: Partial<AppState> | null | undefined): AppState {
  const base = defaultState();
  if (!parsed || typeof parsed !== "object") return base;
  const progress = parsed.progress ?? {};
  return {
    ...base,
    ...parsed,
    progress,
    goal: typeof parsed.goal === "number" && parsed.goal > 0 ? parsed.goal : base.goal,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    onboarded: parsed.onboarded ?? Object.keys(progress).length > 0,
    lastUnit: parsed.lastUnit ?? null,
    studyDays: Array.isArray(parsed.studyDays) ? parsed.studyDays : [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
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
  let { streak, lastStudyDate, todayCount, todayDate, studyDays } = state;

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

  if (!studyDays.includes(today)) {
    studyDays = [...studyDays, today].slice(-180);
  }

  return { ...state, streak, lastStudyDate, todayCount: todayCount + 1, todayDate, studyDays };
}
