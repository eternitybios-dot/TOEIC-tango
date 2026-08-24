import type { AppState, DeckId, SavedSession, Settings, WordProgress } from "../types";
import { emptyProgress } from "./srs";

const KEY = "toeic-tango-v2";
const DECKS: DeckId[] = ["toeic", "business", "travel"];

function emptyDeckProgress(): Record<DeckId, Record<number, WordProgress>> {
  return { toeic: {}, business: {}, travel: {} };
}

function emptyLastUnits(): Record<DeckId, number | null> {
  return { toeic: null, business: null, travel: null };
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function defaultState(): AppState {
  return {
    deck: "toeic",
    progress: {},
    progressByDeck: emptyDeckProgress(),
    streak: 0,
    lastStudyDate: null,
    todayCount: 0,
    todayDate: null,
    goal: 20,
    settings: { sfx: false, quizSound: true, haptics: true, autoSpeak: true },
    onboarded: false,
    lastUnit: null,
    lastUnitByDeck: emptyLastUnits(),
    studyDays: [],
    resume: { study: null, quiz: null },
  };
}

type RawSettings = Partial<Settings> & { sound?: boolean };

export function normalizeState(
  parsed: (Omit<Partial<AppState>, "settings"> & { settings?: RawSettings }) | null | undefined,
): AppState {
  const base = defaultState();
  if (!parsed || typeof parsed !== "object") return base;
  const legacy = parsed.progress ?? {};
  const progressByDeck = emptyDeckProgress();
  for (const deck of DECKS) {
    progressByDeck[deck] = parsed.progressByDeck?.[deck] ?? {};
  }
  if (Object.keys(progressByDeck.toeic).length === 0 && Object.keys(legacy).length > 0) {
    progressByDeck.toeic = legacy;
  }
  const deck: DeckId = DECKS.includes(parsed.deck as DeckId) ? (parsed.deck as DeckId) : "toeic";
  const lastUnitByDeck = emptyLastUnits();
  for (const item of DECKS) {
    lastUnitByDeck[item] = parsed.lastUnitByDeck?.[item] ?? null;
  }
  if (lastUnitByDeck.toeic == null && parsed.lastUnit != null) lastUnitByDeck.toeic = parsed.lastUnit;

  const parsedSettings = parsed.settings ?? {};
  const mutedAll = parsedSettings.sound === false;
  const settings: Settings = {
    sfx: parsedSettings.sfx ?? false,
    quizSound: parsedSettings.quizSound ?? !mutedAll,
    haptics: parsedSettings.haptics ?? base.settings.haptics,
    autoSpeak: parsedSettings.autoSpeak ?? base.settings.autoSpeak,
  };

  return {
    ...base,
    ...parsed,
    deck,
    progressByDeck,
    progress: progressByDeck[deck],
    goal: typeof parsed.goal === "number" && parsed.goal > 0 ? parsed.goal : base.goal,
    settings,
    onboarded: parsed.onboarded ?? Object.keys(progressByDeck.toeic).length > 0,
    lastUnit: lastUnitByDeck[deck],
    lastUnitByDeck,
    studyDays: Array.isArray(parsed.studyDays) ? parsed.studyDays : [],
    resume: {
      study:
        parsed.resume && "study" in parsed.resume
          ? parsed.resume.study
          : parsed.resume && (parsed.resume as SavedSession).kind === "study"
            ? (parsed.resume as SavedSession)
            : null,
      quiz:
        parsed.resume && "quiz" in parsed.resume
          ? parsed.resume.quiz
          : parsed.resume && (parsed.resume as SavedSession).kind === "quiz"
            ? (parsed.resume as SavedSession)
            : null,
    },
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
  return (state.progressByDeck[state.deck] ?? {})[id] ?? state.progress[id] ?? emptyProgress();
}

export function writeProgress(state: AppState, id: number, progress: WordProgress): AppState {
  const deck = state.deck;
  const current = state.progressByDeck[deck] ?? {};
  const nextDeck = { ...current, [id]: progress };
  return {
    ...state,
    progress: nextDeck,
    progressByDeck: { ...state.progressByDeck, [deck]: nextDeck },
  };
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
