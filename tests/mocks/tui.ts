import type { TUI } from "@earendil-works/pi-tui";
import { vi } from "vitest";

/** Returns a stub {@link TUI} with no-op methods. */
export function makeTui(): TUI {
  return {
    requestRender: vi.fn(),
    invalidate: vi.fn(),
    onTerminalColorSchemeChange: vi.fn(() => () => {}),
  } as unknown as TUI;
}
