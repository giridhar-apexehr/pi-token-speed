import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProviderOverride } from "../src/config/types";
import {
  ColorBlockUpdater,
  computeNextBlock,
  DisplayColorBlockUpdater,
  ScalarBlockUpdater,
  ThresholdBlockUpdater,
} from "../src/ui/editor/block-updaters";
import { makeSettingsMock } from "./mocks/settings";

// ── ScalarBlockUpdater ───────────────────────────────────────────────────────

describe("ScalarBlockUpdater", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let updater: ScalarBlockUpdater;

  beforeEach(() => {
    settings = makeSettingsMock();
    updater = new ScalarBlockUpdater(settings);
  });

  it.each([
    "display",
    "slidingWindow",
    "useProviderTokens",
    "countStrategy",
    "endTpsBehavior",
    "icon",
    "updateInterval",
    "formatDuration",
  ])("appliesTo returns true for scalar field %s", (id) => {
    expect(updater.appliesTo(id)).toBe(true);
  });

  it("appliesTo returns false for group fields", () => {
    expect(updater.appliesTo("thresholds")).toBe(false);
    expect(updater.appliesTo("thresholds.slow")).toBe(false);
    expect(updater.appliesTo("colors.slow")).toBe(false);
  });

  it("resets a scalar to base when value is BASE", () => {
    const block: ProviderOverride = { display: "stats" };
    const next = updater.compute(block, "display", "(base)");
    expect(next).toEqual({});
  });

  it("sets a valid scalar value", () => {
    const block: ProviderOverride = {};
    const next = updater.compute(block, "display", "TPS speed");
    expect(next).toEqual({ display: "tps" });
  });

  it("rejects an invalid scalar value", () => {
    const block: Record<string, unknown> = {};
    const next = updater.compute(block, "display", "bogus-value");
    expect(next).toBeNull();
  });
});

// ── ThresholdBlockUpdater ────────────────────────────────────────────────────

describe("ThresholdBlockUpdater", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  let updater: ThresholdBlockUpdater;
  const onWarning = vi.fn();

  beforeEach(() => {
    settings = makeSettingsMock();
    updater = new ThresholdBlockUpdater(settings);
    onWarning.mockClear();
  });

  it.each([
    "thresholds.slow",
    "thresholds.medium",
    "thresholds.fast",
    "thresholds.blazing",
  ])("appliesTo returns true for %s", (id) => {
    expect(updater.appliesTo(id)).toBe(true);
  });

  it("appliesTo returns false for non-threshold fields", () => {
    expect(updater.appliesTo("colors.slow")).toBe(false);
    expect(updater.appliesTo("display")).toBe(false);
  });

  it("sets a valid threshold value", () => {
    const block = {};
    const next = updater.compute(block, "thresholds.slow", "20", onWarning);
    expect(next).toEqual({ thresholds: { slow: 20 } });
    expect(onWarning).not.toHaveBeenCalled();
  });

  it("removes a threshold key when value is empty", () => {
    const block = { thresholds: { slow: 10, medium: 30 } };
    const next = updater.compute(block, "thresholds.slow", "", onWarning);
    expect(next).toEqual({ thresholds: { medium: 30 } });
  });

  it("removes thresholds group when all keys are empty", () => {
    const block = { thresholds: { slow: 10 } };
    const next = updater.compute(block, "thresholds.slow", "", onWarning);
    expect(next).toEqual({});
  });

  it("rejects negative threshold values", () => {
    const block = {};
    const next = updater.compute(block, "thresholds.slow", "-5", onWarning);
    expect(next).toBeNull();
  });

  it("rejects non-integer threshold values", () => {
    const block = {};
    const next = updater.compute(block, "thresholds.slow", "3.5", onWarning);
    expect(next).toBeNull();
  });

  it("warns and rejects when merged thresholds break ascending order", () => {
    // Base has slow=10, medium=30. Setting fast=15 would make merged {slow:10, medium:30, fast:15}
    // which is not ascending → should warn and return null
    const block = {};
    const next = updater.compute(block, "thresholds.fast", "15", onWarning);
    expect(next).toBeNull();
    expect(onWarning).toHaveBeenCalledWith(
      "[pi-token-speed] Thresholds must be in ascending order.",
    );
  });

  it("accepts a valid threshold that preserves ascending order", () => {
    const block = {};
    const next = updater.compute(block, "thresholds.fast", "60", onWarning);
    expect(next).toEqual({ thresholds: { fast: 60 } });
    expect(onWarning).not.toHaveBeenCalled();
  });
});

// ── ColorBlockUpdater ────────────────────────────────────────────────────────

describe("ColorBlockUpdater", () => {
  let updater: ColorBlockUpdater;

  beforeEach(() => {
    updater = new ColorBlockUpdater();
  });

  it.each(["colors.slow", "colors.medium", "colors.fast", "colors.blazing"])(
    "appliesTo returns true for %s",
    (id) => {
      expect(updater.appliesTo(id)).toBe(true);
    },
  );

  it("appliesTo returns false for non-color fields", () => {
    expect(updater.appliesTo("thresholds.slow")).toBe(false);
    expect(updater.appliesTo("display")).toBe(false);
  });

  it("sets a color value (lowercased)", () => {
    const block = {};
    const next = updater.compute(block, "colors.slow", "#AABBCC");
    expect(next).toEqual({ colors: { slow: "#aabbcc" } });
  });

  it("removes a color key when value is empty", () => {
    const block = { colors: { slow: "#ff0000", medium: "#00ff00" } };
    const next = updater.compute(block, "colors.slow", "");
    expect(next).toEqual({ colors: { medium: "#00ff00" } });
  });

  it("removes colors group when all keys are empty", () => {
    const block = { colors: { slow: "#ff0000" } };
    const next = updater.compute(block, "colors.slow", "");
    expect(next).toEqual({});
  });

  it("preserves existing keys when setting a new one", () => {
    const block = { colors: { slow: "#ff0000" } };
    const next = updater.compute(block, "colors.medium", "#00ff00");
    expect(next).toEqual({ colors: { slow: "#ff0000", medium: "#00ff00" } });
  });
});

// ── DisplayColorBlockUpdater ─────────────────────────────────────────────────

describe("DisplayColorBlockUpdater", () => {
  let updater: DisplayColorBlockUpdater;

  beforeEach(() => {
    updater = new DisplayColorBlockUpdater();
  });

  it.each([
    "displayColors.count",
    "displayColors.elapsed",
    "displayColors.ttft",
  ])("appliesTo returns true for %s", (id) => {
    expect(updater.appliesTo(id)).toBe(true);
  });

  it("appliesTo returns false for non-displayColor fields", () => {
    expect(updater.appliesTo("colors.slow")).toBe(false);
    expect(updater.appliesTo("display")).toBe(false);
  });

  it("sets a display color value (lowercased)", () => {
    const block = {};
    const next = updater.compute(block, "displayColors.count", "#AABBCC");
    expect(next).toEqual({ displayColors: { count: "#aabbcc" } });
  });

  it("removes a display color key when value is empty", () => {
    const block = { displayColors: { count: "#ff0000", elapsed: "#00ff00" } };
    const next = updater.compute(block, "displayColors.count", "");
    expect(next).toEqual({ displayColors: { elapsed: "#00ff00" } });
  });

  it("removes displayColors group when all keys are empty", () => {
    const block = { displayColors: { count: "#ff0000" } };
    const next = updater.compute(block, "displayColors.count", "");
    expect(next).toEqual({});
  });
});

// ── computeNextBlock (dispatch) ──────────────────────────────────────────────

describe("computeNextBlock", () => {
  let settings: ReturnType<typeof makeSettingsMock>;
  const onWarning = vi.fn();

  beforeEach(() => {
    settings = makeSettingsMock();
    onWarning.mockClear();
  });

  it("dispatches to ScalarBlockUpdater for scalar fields", () => {
    const next = computeNextBlock(
      {},
      "display",
      "TPS speed",
      onWarning,
      settings,
    );
    expect(next).toEqual({ display: "tps" });
  });

  it("dispatches to ScalarBlockUpdater and rejects invalid values", () => {
    const next = computeNextBlock({}, "display", "bogus", onWarning, settings);
    expect(next).toBeNull();
  });

  it("dispatches to ThresholdBlockUpdater for threshold fields", () => {
    const next = computeNextBlock(
      {},
      "thresholds.slow",
      "20",
      onWarning,
      settings,
    );
    expect(next).toEqual({ thresholds: { slow: 20 } });
  });

  it("dispatches to ColorBlockUpdater for color fields", () => {
    const next = computeNextBlock(
      {},
      "colors.slow",
      "#AABBCC",
      onWarning,
      settings,
    );
    expect(next).toEqual({ colors: { slow: "#aabbcc" } });
  });

  it("dispatches to DisplayColorBlockUpdater for displayColor fields", () => {
    const next = computeNextBlock(
      {},
      "displayColors.count",
      "#AABBCC",
      onWarning,
      settings,
    );
    expect(next).toEqual({ displayColors: { count: "#aabbcc" } });
  });

  it("returns null for unknown field ids", () => {
    const next = computeNextBlock(
      {},
      "unknown.field",
      "value",
      onWarning,
      settings,
    );
    expect(next).toBeNull();
  });

  it("forwards warnings from ThresholdBlockUpdater", () => {
    computeNextBlock({}, "thresholds.fast", "15", onWarning, settings);
    expect(onWarning).toHaveBeenCalledWith(
      "[pi-token-speed] Thresholds must be in ascending order.",
    );
  });
});
