import { ScalarSettingsItem } from "./scalar";

/**
 * Where the TPS readout is rendered.
 *
 * - `footer`: Pi's footer status entry (classic behavior).
 * - `border`: the right side of the message input's top border.
 */
export type Placement = "footer" | "border";

export const PLACEMENT_DEFAULT: Placement = "footer";

const PLACEMENT_LABELS: Record<Placement, string> = {
  footer: "Footer status bar",
  border: "Above input (border)",
};

/**
 * Enum setting: placement of the readout.
 *
 * Uses ScalarSettingsItem with `labels` for dropdown display, so the same
 * item also drives `/tps` menu rows and provider overrides.
 */
export class PlacementSettingsItem extends ScalarSettingsItem<Placement> {
  constructor() {
    super({
      id: "placement",
      label: "Placement",
      description: "Where to render the TPS readout",
      default: PLACEMENT_DEFAULT,
      labels: PLACEMENT_LABELS,
    });
  }
}