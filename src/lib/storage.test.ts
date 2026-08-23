import { describe, expect, it } from "vitest";
import { defaultState, normalizeState, todayKey, withStudyTick } from "./storage";

describe("storage", () => {
  it("fills new settings for older saved state", () => {
    const next = normalizeState({
      progress: { 1: { ease: 2.5, interval: 1, repetitions: 1, nextReview: 1, lastResult: "good", seen: 1, correct: 1, wrong: 0 } },
      streak: 3,
      goal: 20,
    });
    expect(next.settings.sound).toBe(true);
    expect(next.settings.haptics).toBe(true);
    expect(next.settings.autoSpeak).toBe(true);
    expect(next.onboarded).toBe(true);
    expect(next.studyDays).toEqual([]);
    expect(next.streak).toBe(3);
  });

  it("keeps a muted sound setting", () => {
    const next = normalizeState({
      settings: { sound: false, haptics: true, autoSpeak: false },
    });
    expect(next.settings.sound).toBe(false);
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
