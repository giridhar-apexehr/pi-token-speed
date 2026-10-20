import { beforeEach, describe, expect, it } from "vitest";

import type { DisplayColorKey, TokenSpeedConfig } from "../../src/config/types";
import { DISPLAY_COLOR_LABELS } from "../../src/settings/items/display-colors/color";
import { TIERS } from "../../src/settings/options";
import {
  OverrideTierSubmenuBuilder,
  TierSubmenuBuilder,
} from "../../src/ui/color-picker";
import { makeSettingsMock } from "../mocks/settings";
import { makeTheme } from "../mocks/theme";
import { makeTui } from "../mocks/tui";

// ── Testable subclasses (protected methods need exposure) ────────────────────

class TestableTierSubmenuBuilder extends TierSubmenuBuilder {
  public testValidateThreshold(raw: string): string | null {
    return this.validateThreshold(raw);
  }
  public testValidateColor(raw: string): string | null {
    return this.validateColor(raw);
  }
  public testValidateDisplayColor(raw: string): string | null {
    return this.validateDisplayColor(raw);
  }
  public testResolveThreshold(tier: (typeof TIERS)[number]["key"]): number {
    return this.resolveThreshold(tier);
  }
  public testResolveColor(tier: (typeof TIERS)[number]["key"]): string {
    return this.resolveColor(tier);
  }
  public testResolveDisplayColor(
    key: keyof typeof DISPLAY_COLOR_LABELS,
  ): string {
    return this.resolveDisplayColor(key);
  }
}

class TestableOverrideBuilder extends OverrideTierSubmenuBuilder {
  public testValidateThreshold(raw: string): string | null {
    return this.validateThreshold(raw);
  }
  public testValidateColor(raw: string): string | null {
    return this.validateColor(raw);
  }
  public testValidateDisplayColor(raw: string): string | null {
    return this.validateDisplayColor(raw);
  }
  public testResolveThreshold(tier: (typeof TIERS)[number]["key"]): number {
    return this.resolveThreshold(tier);
  }
  public testResolveColor(tier: (typeof TIERS)[number]["key"]): string {
    return this.resolveColor(tier);
  }
  public testResolveDisplayColor(
    key: keyof typeof DISPLAY_COLOR_LABELS,
  ): string {
    return this.resolveDisplayColor(key);
  }
}

// ── TierSubmenuBuilder — validation ──────────────────────────────────────────

describe("TierSubmenuBuilder validation", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let builder: TestableTierSubmenuBuilder;

  beforeEach(() => {
    settings = makeSettingsMock({
      thresholds: { slow: 10, medium: 30, fast: 60, blazing: 100 },
      colors: {
        slow: "#ffcc00",
        medium: "#88cc00",
        fast: "#44cc44",
        blazing: "#00ccff",
      },
      displayColors: { count: "#aabbcc", elapsed: "", ttft: "#112233" },
    });
    builder = new TestableTierSubmenuBuilder(makeTheme(), makeTui(), settings);
  });

  // ── validateThreshold ─────────────────────────────────────────────────

  describe("validateThreshold", () => {
    it("accepts a valid non-negative integer", () => {
      expect(builder.testValidateThreshold("42")).toBe("42");
    });

    it("accepts zero", () => {
      expect(builder.testValidateThreshold("0")).toBe("0");
    });

    it("rejects negative numbers", () => {
      expect(builder.testValidateThreshold("-5")).toBeNull();
    });

    it("rejects floats", () => {
      expect(builder.testValidateThreshold("3.14")).toBeNull();
    });

    it("rejects non-numeric strings", () => {
      expect(builder.testValidateThreshold("abc")).toBeNull();
    });

    it('accepts empty string as "0" (Number("") === 0)', () => {
      expect(builder.testValidateThreshold("")).toBe("0");
    });
  });

  // ── validateColor ─────────────────────────────────────────────────────

  describe("validateColor", () => {
    it("accepts valid hex and lowercases it", () => {
      expect(builder.testValidateColor("#AABBCC")).toBe("#aabbcc");
    });

    it("accepts lowercase hex as-is", () => {
      expect(builder.testValidateColor("#aabbcc")).toBe("#aabbcc");
    });

    it("rejects invalid hex", () => {
      expect(builder.testValidateColor("nope")).toBeNull();
    });

    it("rejects hex without #", () => {
      expect(builder.testValidateColor("aabbcc")).toBeNull();
    });

    it("rejects too-short hex", () => {
      expect(builder.testValidateColor("#abc")).toBeNull();
    });

    it("rejects too-long hex", () => {
      expect(builder.testValidateColor("#aabbccdd")).toBeNull();
    });
  });

  // ── validateDisplayColor ──────────────────────────────────────────────

  describe("validateDisplayColor", () => {
    it("accepts valid hex and lowercases it", () => {
      expect(builder.testValidateDisplayColor("#AABBCC")).toBe("#aabbcc");
    });

    it("rejects invalid hex", () => {
      expect(builder.testValidateDisplayColor("nope")).toBeNull();
    });
  });

  // ── resolve methods ───────────────────────────────────────────────────

  describe("resolve methods", () => {
    it.each(TIERS)("resolves threshold for %s", (tier) => {
      expect(builder.testResolveThreshold(tier.key)).toBe(
        settings.getConfig().thresholds[tier.key],
      );
    });

    it.each(TIERS)("resolves color for %s", (tier) => {
      expect(builder.testResolveColor(tier.key)).toBe(
        settings.getConfig().colors[tier.key],
      );
    });

    it.each(["count", "elapsed", "ttft"] as const)(
      "resolves displayColor for %s",
      (key) => {
        expect(builder.testResolveDisplayColor(key)).toBe(
          settings.getConfig().displayColors[key],
        );
      },
    );
  });
});

// ── OverrideTierSubmenuBuilder — validation ────────────────────────────────

describe("OverrideTierSubmenuBuilder validation", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let builder: TestableOverrideBuilder;
  const base = {
    thresholds: { slow: 10, medium: 30, fast: 60, blazing: 100 },
    colors: {
      slow: "#ffcc00",
      medium: "#88cc00",
      fast: "#44cc44",
      blazing: "#00ccff",
    },
    displayColors: { count: "#aabbcc", elapsed: "", ttft: "#112233" },
  } as unknown as TokenSpeedConfig;
  const block = {
    thresholds: { slow: 20 },
    colors: { fast: "#ff0000" },
    displayColors: { count: "#ff00ff" },
  };

  beforeEach(() => {
    settings = makeSettingsMock();
    builder = new TestableOverrideBuilder(
      makeTheme(),
      makeTui(),
      settings,
      base,
      () => block,
    );
  });

  // ── validateThreshold (accepts empty = reset) ─────────────────────────

  describe("validateThreshold", () => {
    it("accepts empty string as reset marker", () => {
      expect(builder.testValidateThreshold("")).toBe("");
    });

    it("accepts whitespace-only as reset marker", () => {
      expect(builder.testValidateThreshold("  ")).toBe("");
    });

    it("accepts a valid non-negative integer", () => {
      expect(builder.testValidateThreshold("42")).toBe("42");
    });

    it("rejects negative numbers", () => {
      expect(builder.testValidateThreshold("-5")).toBeNull();
    });

    it("rejects floats", () => {
      expect(builder.testValidateThreshold("3.14")).toBeNull();
    });
  });

  // ── validateColor (accepts empty = reset) ─────────────────────────────

  describe("validateColor", () => {
    it("accepts empty string as reset marker", () => {
      expect(builder.testValidateColor("")).toBe("");
    });

    it("accepts whitespace-only as reset marker", () => {
      expect(builder.testValidateColor("   ")).toBe("");
    });

    it("accepts valid hex and lowercases it", () => {
      expect(builder.testValidateColor("#AABBCC")).toBe("#aabbcc");
    });

    it("rejects invalid hex", () => {
      expect(builder.testValidateColor("nope")).toBeNull();
    });
  });

  // ── validateDisplayColor (accepts empty = reset) ──────────────────────

  describe("validateDisplayColor", () => {
    it("accepts empty string as reset marker", () => {
      expect(builder.testValidateDisplayColor("")).toBe("");
    });

    it("accepts whitespace-only as reset marker", () => {
      expect(builder.testValidateDisplayColor("  ")).toBe("");
    });

    it("accepts valid hex and lowercases it", () => {
      expect(builder.testValidateDisplayColor("#AABBCC")).toBe("#aabbcc");
    });

    it("rejects invalid hex", () => {
      expect(builder.testValidateDisplayColor("nope")).toBeNull();
    });
  });

  // ── resolve methods (override block vs base fallback) ─────────────────

  describe("resolve methods", () => {
    it("reads overridden threshold from block", () => {
      expect(builder.testResolveThreshold("slow")).toBe(20);
    });

    it("falls back to base threshold when not overridden", () => {
      expect(builder.testResolveThreshold("medium")).toBe(30);
    });

    it("reads overridden color from block", () => {
      expect(builder.testResolveColor("fast")).toBe("#ff0000");
    });

    it("falls back to base color when not overridden", () => {
      expect(builder.testResolveColor("slow")).toBe("#ffcc00");
    });

    it("reads overridden displayColor from block", () => {
      expect(builder.testResolveDisplayColor("count")).toBe("#ff00ff");
    });

    it("falls back to base displayColor when not overridden", () => {
      expect(builder.testResolveDisplayColor("elapsed")).toBe("");
    });
  });
});

// ── buildDisplayColors ──────────────────────────────────────────────────────

describe("TierSubmenuBuilder.buildDisplayColors", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let builder: TierSubmenuBuilder;

  beforeEach(() => {
    settings = makeSettingsMock({
      displayColors: { count: "#ff0000", elapsed: "#00ff00", ttft: "#0000ff" },
    });
    builder = new TierSubmenuBuilder(makeTheme(), makeTui(), settings);
  });

  it("returns one item per display color key", () => {
    const items = builder.buildDisplayColors();
    expect(items).toHaveLength(3);
  });

  it.each(["count", "elapsed", "ttft"])(
    "each item has the correct id for %s",
    (key) => {
      const items = builder.buildDisplayColors();
      const item = items.find((i) => i.id === `displayColors.${key}`);
      expect(item).toBeDefined();
    },
  );

  it.each(["count", "elapsed", "ttft"])(
    "each item label includes the colored block and %s label",
    (key) => {
      const items = builder.buildDisplayColors();
      const item = items.find((i) => i.id === `displayColors.${key}`);
      expect(item?.label).toContain("■");
      expect(item?.label).toContain(
        DISPLAY_COLOR_LABELS[key as DisplayColorKey],
      );
    },
  );

  it.each(["count", "elapsed", "ttft"])(
    "each item shows the current color value for %s",
    (key) => {
      const items = builder.buildDisplayColors();
      const item = items.find((i) => i.id === `displayColors.${key}`);
      expect(item?.currentValue).toBe(
        (settings.getConfig().displayColors as Record<string, string>)[key] ||
          "(none)",
      );
    },
  );

  it("each item has a submenu factory", () => {
    const items = builder.buildDisplayColors();
    for (const item of items) {
      expect(typeof item.submenu).toBe("function");
    }
  });
});
