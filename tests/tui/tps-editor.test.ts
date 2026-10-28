import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import {
  EditorBorderStatus,
  TokenSpeedEditor,
} from "../../src/ui/tps-editor";
import { makeTui } from "../mocks/tui";

const THEME = {
  borderColor: (text: string) => text,
  selectList: {},
};

/** Builds an editor wired to an uncolored border so assertions can be exact. */
const makeEditor = (
  status: EditorBorderStatus,
  options?: Record<string, unknown>,
): TokenSpeedEditor =>
  new TokenSpeedEditor(
    status,
    makeTui(),
    THEME as any,
    {} as any,
    options as any,
  );

/** Renders the top border, bypassing TypeScript's protected modifier. */
const topBorder = (
  editor: TokenSpeedEditor,
  width: number,
  hiddenLineCount = 0,
): string => (editor as any).renderTopBorder(width, hiddenLineCount);

describe("TokenSpeedEditor", () => {
  describe("renderTopBorder", () => {
    it("renders a plain border when no label is set", () => {
      const status = new EditorBorderStatus();
      const editor = makeEditor(status);

      expect(topBorder(editor, 20)).toBe("─".repeat(20));
    });

    it("puts the label flush to the right edge", () => {
      const status = new EditorBorderStatus();
      status.set("TPS: 42.5 tok/s");
      const editor = makeEditor(status);

      const line = topBorder(editor, 40);

      expect(line).toBe(`${"─".repeat(40 - "TPS: 42.5 tok/s".length - 3)} TPS: 42.5 tok/s ─`);
      expect(visibleWidth(line)).toBe(40);
    });

    it("keeps the exact terminal width when the label has wide characters", () => {
      const status = new EditorBorderStatus();
      status.set("⚡ TPS: 42.5 tok/s");
      const editor = makeEditor(status);
      const label = "⚡ TPS: 42.5 tok/s";

      const line = topBorder(editor, 40);

      expect(visibleWidth(line)).toBe(40);
      expect(line.endsWith(`${label} ─`)).toBe(true);
    });

    it("drops the label when the border is too narrow for it", () => {
      const status = new EditorBorderStatus();
      status.set("⚡ TPS: 42.5 tok/s");
      const editor = makeEditor(status);

      const line = topBorder(editor, 10);

      expect(line).toBe("─".repeat(10));
    });

    it("keeps the width and scroll indicator when lines are hidden", () => {
      const status = new EditorBorderStatus();
      status.set("TPS: 12.0 tok/s");
      const editor = makeEditor(status);

      const line = topBorder(editor, 40, 120);

      expect(visibleWidth(line)).toBe(40);
      expect(line).toContain("↑ 120 more");
      expect(line.endsWith("TPS: 12.0 tok/s ─")).toBe(true);
    });

    it("keeps the embedded working status and appends the label", () => {
      const status = new EditorBorderStatus();
      status.set("TPS: 12.0 tok/s");
      const editor = makeEditor(status, { embedWorkingStatus: true });
      (editor as any).setWorkingStatusIndicator({
        renderInBorder: () => "working…",
        renderSpinnerInBorder: () => "…",
      });

      const line = topBorder(editor, 40);

      expect(visibleWidth(line)).toBe(40);
      expect(line).toContain("working…");
      expect(line.endsWith("TPS: 12.0 tok/s ─")).toBe(true);
    });

    it("re-renders with the new label after the status changes", () => {
      const status = new EditorBorderStatus();
      const editor = makeEditor(status);
      status.set("TPS: 1.0 tok/s");
      expect(topBorder(editor, 30)).toContain("TPS: 1.0 tok/s");

      status.set("TPS: 9.0 tok/s");

      expect(topBorder(editor, 30)).toContain("TPS: 9.0 tok/s");
    });
  });

  describe("dispose", () => {
    it("detaches the editor from the status holder", () => {
      const status = new EditorBorderStatus();
      const editor = makeEditor(status);
      expect(status.hasEditor()).toBe(true);

      editor.dispose();

      expect(status.hasEditor()).toBe(false);
    });
  });
});

describe("EditorBorderStatus", () => {
  it("starts empty and unmounted", () => {
    const status = new EditorBorderStatus();

    expect(status.get()).toBe("");
    expect(status.hasEditor()).toBe(false);
  });

  it("stores the label before an editor is mounted", () => {
    const status = new EditorBorderStatus();
    status.set("TPS: 3.0 tok/s");

    expect(status.get()).toBe("TPS: 3.0 tok/s");
  });

  it("refreshes the mounted editor when the label changes", () => {
    const status = new EditorBorderStatus();
    const tui = makeTui();
    new TokenSpeedEditor(status, tui, THEME as any, {} as any);

    status.set("TPS: 3.0 tok/s");

    expect(tui.requestRender).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the label is unchanged", () => {
    const status = new EditorBorderStatus();
    const tui = makeTui();
    new TokenSpeedEditor(status, tui, THEME as any, {} as any);

    status.set("TPS: 3.0 tok/s");
    status.set("TPS: 3.0 tok/s");

    expect(tui.requestRender).toHaveBeenCalledTimes(1);
  });

  it("stops refreshing after detach", () => {
    const status = new EditorBorderStatus();
    const tui = makeTui();
    const editor = new TokenSpeedEditor(
      status,
      tui,
      THEME as any,
      {} as any,
    );

    status.detach(editor);
    status.set("TPS: 3.0 tok/s");

    expect(tui.requestRender).not.toHaveBeenCalled();
    expect(status.hasEditor()).toBe(false);
  });

  it("clear resets the label and unmounts the editor", () => {
    const status = new EditorBorderStatus();
    makeEditor(status);
    status.set("TPS: 3.0 tok/s");

    status.clear();

    expect(status.get()).toBe("");
    expect(status.hasEditor()).toBe(false);
  });

  it("clearLabel empties the label but keeps the editor mounted", () => {
    const status = new EditorBorderStatus();
    makeEditor(status);
    status.set("TPS: 3.0 tok/s");

    status.clearLabel();

    expect(status.get()).toBe("");
    expect(status.hasEditor()).toBe(true);
  });
});