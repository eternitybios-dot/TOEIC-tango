import { describe, expect, it } from "vitest";
import { playSfx } from "./feedback";

describe("playSfx", () => {
  it("does nothing when sound is off", () => {
    expect(() => playSfx("correct", false)).not.toThrow();
    expect(() => playSfx("wrong", false)).not.toThrow();
  });
});
