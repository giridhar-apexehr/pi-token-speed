import { describe, expect, it } from "vitest";

import { ThresholdsGroupSettingsItem } from "../../../../src/settings/items/thresholds/group";

describe("ThresholdsGroupSettingsItem", () => {
  const item = new ThresholdsGroupSettingsItem();

  it.each([
    { slow: 10, medium: 30, fast: 60, blazing: 100 },
    { slow: 0, medium: 1, fast: 2, blazing: 3 },
  ])("accepts valid ascending thresholds %s", (thresholds) => {
    const result = item.validate(thresholds);
    expect(result.valid).toBe(true);
  });

  it("rejects undefined", () => {
    expect(item.validate(undefined)).toEqual({
      valid: false,
      errors: ["Thresholds must be an object."],
    });
  });

  it("rejects null", () => {
    expect(item.validate(null)).toEqual({
      valid: false,
      errors: ["Thresholds must be an object."],
    });
  });

  it("rejects string values", () => {
    expect(item.validate("not-an-object")).toEqual({
      valid: false,
      errors: ["Thresholds must be an object."],
    });
  });

  it("rejects an object with a non-numeric value", () => {
    const result = item.validate({
      slow: "high",
      medium: 30,
      fast: 60,
      blazing: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid threshold: "high"');
  });

  it("rejects thresholds with negative values", () => {
    const result = item.validate({
      slow: -1,
      medium: 30,
      fast: 60,
      blazing: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid threshold: "-1"');
  });

  it("rejects thresholds that are not in ascending order", () => {
    const result = item.validate({
      slow: 50,
      medium: 30,
      fast: 60,
      blazing: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "- TPS thresholds must be in ascending order.",
    );
  });

  it("rejects thresholds with equal adjacent values", () => {
    const result = item.validate({
      slow: 10,
      medium: 10,
      fast: 60,
      blazing: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "- TPS thresholds must be in ascending order.",
    );
  });

  it("rejects a partial object missing keys (ascending check fails)", () => {
    // Missing medium, fast, blazing → undefined comparisons fail ascending
    const result = item.validate({ slow: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "- TPS thresholds must be in ascending order.",
    );
  });
});
