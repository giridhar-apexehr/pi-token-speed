import { describe, expect, it } from "vitest";

import type { TokenSpeedConfig } from "../src/config/types";
import { DEFAULT_ICON, IconSettingsItem } from "../src/settings/items/icon";

describe("IconSettingsItem", () => {
  const item = new IconSettingsItem();

  // ── format ───────────────────────────────────────────────────────────────

  describe("format", () => {
    it("returns the icon when set to a non-empty string", () => {
      const config: TokenSpeedConfig = { icon: "🚀" } as TokenSpeedConfig;
      expect(item.format(config)).toBe("🚀");
    });

    it("returns the default icon when the value is empty string", () => {
      const config: TokenSpeedConfig = { icon: "" } as TokenSpeedConfig;
      expect(item.format(config)).toBe(DEFAULT_ICON);
    });

    it("returns the default icon when the value is undefined", () => {
      const config = { icon: undefined } as unknown as TokenSpeedConfig;
      expect(item.format(config)).toBe(DEFAULT_ICON);
    });
  });

  // ── setConfig ────────────────────────────────────────────────────────────

  describe("setConfig", () => {
    it("returns the icon value as-is", () => {
      const result = item.setConfig({} as TokenSpeedConfig, "🔥");
      expect(result).toEqual({ valid: true, config: { icon: "🔥" } });
    });

    it("normalizes '(empty)' to ''", () => {
      const result = item.setConfig({} as TokenSpeedConfig, "(empty)");
      expect(result).toEqual({ valid: true, config: { icon: "" } });
    });

    it("rejects an invalid icon string", () => {
      const result = item.setConfig({} as TokenSpeedConfig, "🤖");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid icon: "🤖"');
    });

    it("rejects an empty string (not in values list)", () => {
      const result = item.setConfig({} as TokenSpeedConfig, "");
      // "" is not in the values list (it's mapped via "(empty)")
      expect(result.valid).toBe(false);
    });
  });

  // ── validate ─────────────────────────────────────────────────────────────

  describe("validate", () => {
    it("accepts a valid icon string", () => {
      const result = item.validate("🚀");
      expect(result).toEqual({ valid: true, corrected: "🚀" });
    });

    it("accepts '(empty)' and normalizes to ''", () => {
      const result = item.validate("(empty)");
      expect(result).toEqual({ valid: true, corrected: "" });
    });

    it("accepts '' and normalizes to ''", () => {
      const result = item.validate("");
      expect(result).toEqual({ valid: true, corrected: "" });
    });

    it("defaults to the default icon for non-string values", () => {
      const result = item.validate(42);
      expect(result).toEqual({
        valid: false,
        corrected: DEFAULT_ICON,
        errors: [
          `Invalid icon (expected string) — defaulting to "${DEFAULT_ICON}".`,
        ],
      });
    });

    it("defaults to the default icon for invalid icon strings", () => {
      const result = item.validate("🤖");
      expect(result).toEqual({
        valid: false,
        corrected: DEFAULT_ICON,
        errors: [`Invalid icon "🤖" — defaulting to "${DEFAULT_ICON}".`],
      });
    });

    it("defaults to the default icon for null", () => {
      const result = item.validate(null);
      expect(result.valid).toBe(false);
      expect(result.corrected).toBe(DEFAULT_ICON);
    });
  });
});
