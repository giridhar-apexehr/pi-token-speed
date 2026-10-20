import { beforeEach, describe, expect, it } from "vitest";

import { HexColorInput } from "../src/ui/color-input";

/** Testable subclass that exposes the protected `isHexCharacterInsert` method. */
class TestableHexColorInput extends HexColorInput {
  public testIsHexCharacterInsert(data: string): boolean {
    return this.isHexCharacterInsert(data);
  }
}

describe("HexColorInput", () => {
  let input: TestableHexColorInput;

  beforeEach(() => {
    input = new TestableHexColorInput();
  });

  // ── isHexCharacterInsert ───────────────────────────────────────────────

  describe("isHexCharacterInsert", () => {
    it.each(["#a", "#AABBCC", "#123456", "#ff00ff", "#000000", "#FFFFFF"])(
      "accepts valid hex %s",
      (data) => {
        expect(input.testIsHexCharacterInsert(data)).toBe(true);
      },
    );

    it.each([
      "#", // just the hash
      "abc", // lowercase hex letters
      "#abc", // hash + lowercase hex
    ])(
      "accepts non-control printable strings that pass the regex %s",
      (data) => {
        // These pass the HEX_CHAR regex but would be rejected by isValidHex
        // The method only checks for hex characters, not validity
        expect(input.testIsHexCharacterInsert(data)).toBe(true);
      },
    );

    it.each([
      "\x1b[A", // escape sequence
      "\x1b[200~", // bracketed paste
      "\n", // newline
      "\r", // carriage return
      "\t", // tab
      "\u0000", // null
      "\u007f", // delete
      "\u0080", // C1 control
      "\u009f", // C1 control
    ])("rejects control characters and escape sequences %s", (data) => {
      expect(input.testIsHexCharacterInsert(data)).toBe(false);
    });

    it.each(["g", "z", "G", "Z", "!", "@"])(
      "rejects non-hex characters %s",
      (data) => {
        expect(input.testIsHexCharacterInsert(data)).toBe(false);
      },
    );

    it("accepts a mix of uppercase and lowercase hex", () => {
      expect(input.testIsHexCharacterInsert("#aAbBcC")).toBe(true);
    });
  });
});
