import { describe, expect, it } from "vitest";
import { playSfx } from "./feedback";

describe("playSfx", () => {
  it("does nothing when sound is off", () => {
    expect(() => playSfx("correct", { sfx: false, quizSound: false })).not.toThrow();
    expect(() => playSfx("wrong", { sfx: false, quizSound: false })).not.toThrow();
  });
});
