import { describe, expect, it } from "vitest";

import {
  PLACEMENT_DEFAULT,
  PlacementSettingsItem,
} from "../../../src/settings/items/placement";
import { makeSettingsMock } from "../../mocks/settings";

const settings = makeSettingsMock();
const item = new PlacementSettingsItem();

describe("PlacementSettingsItem", () => {
  it("defaults to the footer", () => {
    expect(item.getDefault()).toBe("footer");
    expect(PLACEMENT_DEFAULT).toBe("footer");
    expect(settings.getDefaultConfig().placement).toBe("footer");
  });

  it("formats the enum value as its display label", () => {
    const config = settings.getDefaultConfig();

    expect(item.format({ ...config, placement: "footer" })).toBe(
      "Footer status bar",
    );
    expect(item.format({ ...config, placement: "border" })).toBe(
      "Above input (border)",
    );
  });

  it("maps a display label back to its config value", () => {
    const config = settings.getDefaultConfig();

    expect(item.setConfig(config, "Above input (border)")).toEqual({
      valid: true,
      config: { placement: "border" },
    });
    expect(item.setConfig(config, "Footer status bar")).toEqual({
      valid: true,
      config: { placement: "footer" },
    });
  });

  it("rejects unknown display labels", () => {
    const result = item.setConfig(settings.getDefaultConfig(), "Sidebar");

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain('Invalid placement: "Sidebar"');
  });

  it("validates known placements and corrects anything else to the footer", () => {
    expect(item.validate("border")).toEqual({ valid: true, corrected: "border" });
    expect(item.validate("footer")).toEqual({ valid: true, corrected: "footer" });

    const invalid = item.validate("sidebar");
    expect(invalid.valid).toBe(false);
    expect(invalid.corrected).toBe("footer");
    expect(invalid.errors?.[0]).toContain('Invalid placement "sidebar"');
  });
});