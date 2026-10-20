import type { Theme } from "@earendil-works/pi-coding-agent";

/** Returns a stub {@link Theme} that passes text through unchanged. */
export function makeTheme(): Theme {
  return {
    fg: (_name: string, text: string) => text,
    bg: (_name: string, text: string) => text,
    bold: (text: string) => text,
    dim: (text: string) => text,
  } as unknown as Theme;
}
