import { describe, expect, it } from "vitest";
import { isNative } from "./native";

describe("isNative", () => {
  it("is false in unit tests", () => {
    expect(isNative()).toBe(false);
  });
});
