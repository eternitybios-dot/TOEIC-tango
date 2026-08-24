import { describe, expect, it } from "vitest";
import { defaultState, normalizeState, todayKey, withStudyTick } from "./storage";

describe("storage", () => {
  it("fills new settings for older saved state", () => {
    const next = normalizeState({
      progress: { 1: { ease: 2.5, interval: 1, repetitions: 1, nextReview: 1, lastResult: "good", seen: 1, correct: 1, wrong: 0 } },
      streak: 3,
      goal: 20,
    });
    expect(next.settings.sfx).toBe(false);
    expect(next.settings.quizSound).toBe(true);
    expect(next.settings.haptics).toBe(true);
    expect(next.settings.autoSpeak).toBe(true);
    expect(next.onboarded).toBe(true);
    expect(next.studyDays).toEqual([]);
    expect(next.streak).toBe(3);
    expect(next.deck).toBe("toeic");
    expect(next.progressByDeck.toeic[1]?.correct).toBe(1);
    expect(next.resume.study).toBe(null);
    expect(next.resume.quiz).toBe(null);
  });

  it("keeps a saved deck and resume session", () => {
    const next = normalizeState({
      deck: "business",
      progressByDeck: { toeic: {}, business: { 20001: { ease: 2.5, interval: 0, repetitions: 0, nextReview: 0, lastResult: "again", seen: 1, correct: 0, wrong: 1 } }, travel: {} },
      resume: {
        study: {
          kind: "study",
          deck: "business",
          mix: "due",
          size: 10,
          scope: { type: "all" },
          queue: [20001],
          index: 0,
          seen: [],
          good: 0,
          again: 0,
          score: 0,
          missed: [],
          quizMode: "en-ja",
          sessionLen: 10,
        },
        quiz: null,
      },
    });
    expect(next.deck).toBe("business");
    expect(next.progressByDeck.business[20001]?.wrong).toBe(1);
    expect(next.resume.study?.kind).toBe("study");
    expect(next.resume.study?.queue).toEqual([20001]);
  });

  it("migrates a muted master sound to both sound toggles off", () => {
    const next = normalizeState({
      settings: { sound: false, haptics: true, autoSpeak: false },
    });
    expect(next.settings.sfx).toBe(false);
    expect(next.settings.quizSound).toBe(false);
    expect(next.settings.autoSpeak).toBe(false);
  });

  it("keeps a new user on onboarding", () => {
    expect(normalizeState({}).onboarded).toBe(false);
    expect(defaultState().onboarded).toBe(false);
  });

  it("records the study day when ticking", () => {
    const now = new Date("2026-08-22T10:00:00");
    const next = withStudyTick(defaultState(), now);
    expect(next.studyDays).toEqual([todayKey(now)]);
    expect(next.todayCount).toBe(1);
    expect(next.streak).toBe(1);
    expect(withStudyTick(next, now).studyDays).toEqual([todayKey(now)]);
  });
});
