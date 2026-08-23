import { describe, expect, it } from "vitest";
import { exampleVisibility } from "./quiz";

describe("exampleVisibility", () => {
  it("keeps the Japanese example on 和英 after a correct answer", () => {
    expect(exampleVisibility("ja-en", false)).toEqual({ ja: true, en: false });
    expect(exampleVisibility("ja-en", true)).toEqual({ ja: true, en: true });
  });

  it("does not show the Japanese example on 英和 until answered", () => {
    expect(exampleVisibility("en-ja", false)).toEqual({ ja: false, en: true });
    expect(exampleVisibility("en-ja", true)).toEqual({ ja: true, en: true });
  });

  it("always shows both lines for 空所", () => {
    expect(exampleVisibility("cloze", false)).toEqual({ ja: true, en: true });
    expect(exampleVisibility("cloze", true)).toEqual({ ja: true, en: true });
  });
});
