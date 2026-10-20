import { describe, expect, it } from "vitest";

import { DisplayColorsGroupSettingsItem } from "../../../../src/settings/items/display-colors/group";

describe("DisplayColorsGroupSettingsItem", () => {
  const item = new DisplayColorsGroupSettingsItem();

  it.each([
    { count: "#ff0000", elapsed: "#00ff00", ttft: "#0000ff" },
    { count: "#aabbcc", elapsed: "#ddeeff", ttft: "#112233" },
  ])("accepts valid display colors %s", (colors) => {
    const result = item.validate(colors);
    expect(result.valid).toBe(true);
  });

  it("accepts undefined (early-return guard)", () => {
    expect(item.validate(undefined)).toEqual({ valid: true });
  });

  it("accepts null (typeof null === 'object' in JS)", () => {
    // null passes the guard: null !== undefined is true, typeof null === "object"
    const result = item.validate(null as unknown as Record<string, unknown>);
    expect(result.valid).toBe(true);
  });

  it("accepts empty object", () => {
    const result = item.validate({});
    expect(result.valid).toBe(true);
  });

  it("accepts empty string values (unset = valid)", () => {
    const result = item.validate({ count: "", elapsed: "", ttft: "" });
    expect(result.valid).toBe(true);
  });

  it("rejects string values", () => {
    expect(item.validate("not-an-object")).toEqual({
      valid: false,
      errors: ["Display colors must be an object."],
    });
  });

  it("rejects an object with an invalid hex color", () => {
    const result = item.validate({
      count: "nope",
      elapsed: "#00ff00",
      ttft: "#0000ff",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid hex color: "nope"');
  });

  it("accepts a partial object with valid hex values", () => {
    const result = item.validate({ count: "#ff0000" });
    expect(result.valid).toBe(true);
  });
});
