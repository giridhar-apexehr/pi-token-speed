import { beforeEach, describe, expect, it, vi } from "vitest";

import { TIERS } from "../../src/settings/options";
import { TierSubmenuBuilder } from "../../src/ui/color-picker";
import { makeSettingsMock } from "../mocks/settings";
import { makeTheme } from "../mocks/theme";
import { makeTui } from "../mocks/tui";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TierSubmenuBuilder.buildThresholds", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let builder: TierSubmenuBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    settings = makeSettingsMock({
      thresholds: { slow: 10, medium: 30, fast: 60, blazing: 100 },
    });
    builder = new TierSubmenuBuilder(makeTheme(), makeTui(), settings);
  });

  it("returns one item per tier", () => {
    const items = builder.buildThresholds();
    expect(items).toHaveLength(TIERS.length);
  });

  it("each item has the correct tier id and label", () => {
    const items = builder.buildThresholds();
    for (const tier of TIERS) {
      const item = items.find((i) => i.id === `thresholds.${tier.key}`);
      expect(item).toBeDefined();
      expect(item?.label).toBe(tier.label);
    }
  });

  it("each item shows the current threshold value", () => {
    const items = builder.buildThresholds();
    const expected: Record<string, string> = {
      slow: "10",
      medium: "30",
      fast: "60",
      blazing: "100",
    };
    for (const tier of TIERS) {
      const item = items.find((i) => i.id === `thresholds.${tier.key}`);
      expect(item?.currentValue).toBe(expected[tier.key]);
    }
  });

  it("each item has a submenu factory", () => {
    const items = builder.buildThresholds();
    for (const item of items) {
      expect(typeof item.submenu).toBe("function");
    }
  });

  it("reads the current config at call time (not cached)", () => {
    settings = makeSettingsMock({
      thresholds: { slow: 99, medium: 99, fast: 99, blazing: 99 },
    });
    builder = new TierSubmenuBuilder(makeTheme(), makeTui(), settings);

    const items = builder.buildThresholds();

    expect(items[0].currentValue).toBe("99");
  });

  it("submenu factory returns a component when invoked", () => {
    const items = builder.buildThresholds();
    const done = vi.fn();
    const component = items[0].submenu!("", done);

    expect(component).toBeDefined();
    expect(typeof component.handleInput).toBe("function");
    expect(typeof component.render).toBe("function");
  });
});
