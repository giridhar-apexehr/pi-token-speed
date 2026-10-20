import { beforeEach, describe, expect, it, vi } from "vitest";

import { TIERS } from "../../src/settings/options";
import { truecolor } from "../../src/ui/ansi";
import { TierSubmenuBuilder } from "../../src/ui/color-picker";
import { makeSettingsMock } from "../mocks/settings";
import { makeTheme } from "../mocks/theme";
import { makeTui } from "../mocks/tui";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("truecolor", () => {
  it("returns a single character with 24-bit truecolor ANSI escape", () => {
    const result = truecolor("■", "#ff0000");
    expect(result).toContain("\x1b[38;2;255;0;0m");
    expect(result).toContain("\x1b[0m");
    expect(result).toContain("■");
  });

  it("normalizes hex to lowercase", () => {
    const result = truecolor("■", "#AABBCC");
    expect(result).toContain("\x1b[38;2;170;187;204m");
  });
});

describe("TierSubmenuBuilder.buildColors", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let builder: TierSubmenuBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    settings = makeSettingsMock({
      colors: {
        slow: "#ffcc00",
        medium: "#88cc00",
        fast: "#44cc44",
        blazing: "#00ccff",
      },
    });
    builder = new TierSubmenuBuilder(makeTheme(), makeTui(), settings);
  });

  it("returns one item per tier", () => {
    const items = builder.buildColors();
    expect(items).toHaveLength(TIERS.length);
  });

  it("each item has the correct tier id", () => {
    const items = builder.buildColors();
    for (const tier of TIERS) {
      const item = items.find((i) => i.id === `colors.${tier.key}`);
      expect(item).toBeDefined();
    }
  });

  it("each item label includes the colored block", () => {
    const items = builder.buildColors();
    for (const item of items) {
      expect(item.label).toContain("■");
    }
  });

  it("each item shows the current color value", () => {
    const items = builder.buildColors();
    const expected: Record<string, string> = {
      slow: "#ffcc00",
      medium: "#88cc00",
      fast: "#44cc44",
      blazing: "#00ccff",
    };
    for (const tier of TIERS) {
      const item = items.find((i) => i.id === `colors.${tier.key}`);
      expect(item?.currentValue).toBe(expected[tier.key]);
    }
  });

  it("each item has a submenu factory", () => {
    const items = builder.buildColors();
    for (const item of items) {
      expect(typeof item.submenu).toBe("function");
    }
  });

  it("reads the current config at call time (not cached)", () => {
    settings = makeSettingsMock({
      colors: {
        slow: "#000000",
        medium: "#111111",
        fast: "#222222",
        blazing: "#333333",
      },
    });
    builder = new TierSubmenuBuilder(makeTheme(), makeTui(), settings);

    const items = builder.buildColors();

    expect(items[0].currentValue).toBe("#000000");
  });

  it("submenu factory returns a component when invoked", () => {
    const items = builder.buildColors();
    const done = vi.fn();
    const component = items[0].submenu!("", done);

    expect(component).toBeDefined();
    expect(typeof component.handleInput).toBe("function");
    expect(typeof component.render).toBe("function");
  });
});
