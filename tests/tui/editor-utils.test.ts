import { beforeEach, describe, expect, it } from "vitest";

import type { ProviderOverride } from "../../src/config/types";
import { fieldValue } from "../../src/ui/editor/utils";
import { makeSettingsMock } from "../mocks/settings";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("fieldValue", () => {
  let settings: ReturnType<typeof makeSettingsMock>;

  beforeEach(() => {
    settings = makeSettingsMock({
      displayColors: { count: "#111111", elapsed: "#222222", ttft: "#333333" },
    });
  });

  describe("scalar fields", () => {
    it("returns BASE when the field is not overridden", () => {
      expect(fieldValue("display", {}, settings)).toBe("(base)");
    });

    it("returns the formatted override when set", () => {
      expect(
        fieldValue("updateInterval", { updateInterval: 250 }, settings),
      ).toBe("250");
    });
  });

  describe("thresholds group row", () => {
    it("shows (base) for every tier when nothing is overridden", () => {
      expect(fieldValue("thresholds", {}, settings)).toBe(
        "(base) | (base) | (base) | (base)",
      );
    });

    it("shows the override value for set tiers and (base) for the rest", () => {
      const block: ProviderOverride = {
        thresholds: { medium: 25 },
      };
      expect(fieldValue("thresholds", block, settings)).toBe(
        "(base) | 25 | (base) | (base)",
      );
    });

    it("resolves tier children to (base) or the override", () => {
      const block: ProviderOverride = {
        thresholds: { fast: 90 },
      };
      expect(fieldValue("thresholds.fast", block, settings)).toBe("90");
      expect(fieldValue("thresholds.slow", block, settings)).toBe("(base)");
    });
  });

  describe("colors group row", () => {
    it("renders one square per tier using the base colors", () => {
      const value = fieldValue("colors", {}, settings);
      expect(value.split("■").length - 1).toBe(4);
      expect(value).toContain("\x1b[38;2;255;204;0m"); // #ffcc00
      expect(value).toContain("\x1b[38;2;0;204;255m"); // #00ccff
    });

    it("renders the override color for set tiers", () => {
      const block: ProviderOverride = {
        colors: { medium: "#ff00ff" },
      };
      const value = fieldValue("colors", block, settings);
      expect(value).toContain("\x1b[38;2;255;0;255m"); // #ff00ff
      expect(value).toContain("\x1b[38;2;255;204;0m"); // base slow
    });
  });

  describe("displayColors group row", () => {
    it("renders one square per key using the base colors", () => {
      const value = fieldValue("displayColors", {}, settings);
      expect(value.split("■").length - 1).toBe(3);
      expect(value).toContain("\x1b[38;2;17;17;17m"); // #111111
    });

    it("renders the override color for set keys", () => {
      const block: ProviderOverride = {
        displayColors: { ttft: "#abcDEF" },
      };
      const value = fieldValue("displayColors", block, settings);
      expect(value).toContain("\x1b[38;2;171;205;239m"); // #abcdef
    });
  });
});
