import { describe, expect, it } from "vitest";

import { ColorsGroupSettingsItem } from "../../../../src/settings/items/colors/group";

describe("ColorsGroupSettingsItem", () => {
  const item = new ColorsGroupSettingsItem();

  it.each([
    { slow: "#ff0000", medium: "#00ff00", fast: "#0000ff", blazing: "#ffffff" },
    { slow: "#aabbcc", medium: "#ddeeff", fast: "#112233", blazing: "#445566" },
  ])("accepts valid colors %s", (colors) => {
    const result = item.validate(colors);
    expect(result.valid).toBe(true);
  });

  it("accepts empty object (no tiers to validate)", () => {
    const result = item.validate({});
    expect(result.valid).toBe(true);
  });

  it("rejects undefined", () => {
    expect(item.validate(undefined)).toEqual({
      valid: false,
      errors: ["Colors must be an object."],
    });
  });

  it("rejects null", () => {
    expect(item.validate(null)).toEqual({
      valid: false,
      errors: ["Colors must be an object."],
    });
  });

  it("rejects string values", () => {
    expect(item.validate("not-an-object")).toEqual({
      valid: false,
      errors: ["Colors must be an object."],
    });
  });

  it("accepts arrays (JS objects) — passes individual tier checks", () => {
    // Arrays pass the typeof check; individual tier.validate(undefined) returns valid
    const result = item.validate([1, 2] as unknown as Record<string, unknown>);
    expect(result.valid).toBe(true);
  });

  it("rejects an object with an invalid hex color", () => {
    const result = item.validate({
      slow: "nope",
      medium: "#00ff00",
      fast: "#0000ff",
      blazing: "#ffffff",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid hex color: "nope"');
  });

  it("rejects an object with multiple invalid colors", () => {
    const result = item.validate({
      slow: "bad",
      medium: "also-bad",
      fast: "#0000ff",
      blazing: "#ffffff",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("accepts a partial object with valid hex values", () => {
    const result = item.validate({ slow: "#ff0000" });
    expect(result.valid).toBe(true);
  });
});
