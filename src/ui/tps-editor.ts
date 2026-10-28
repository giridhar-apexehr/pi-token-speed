import {
  CustomEditor,
  type CustomEditorOptions,
  type KeybindingsManager,
} from "@earendil-works/pi-coding-agent";
import {
  type EditorTheme,
  type TUI,
  visibleWidth,
} from "@earendil-works/pi-tui";

/**
 * Columns consumed around the label itself: one space before it, one space
 * after it, and the closing border character.
 */
const LABEL_CHROME = 3;

/**
 * Holds the right-aligned label drawn on the editor's top border and refreshes
 * the mounted editor whenever the label changes.
 *
 * The label is stored even when no editor is mounted (e.g. RPC mode), so the
 * first rendered frame already shows it.
 */
export class EditorBorderStatus {
  private label = "";
  private mounted?: TokenSpeedEditor;

  /** Returns the current label (ANSI-styled text, or "" when unset). */
  get(): string {
    return this.label;
  }

  /** True while an editor is mounted and can render the label. */
  hasEditor(): boolean {
    return this.mounted !== undefined;
  }

  /** Sets the label and refreshes the mounted editor. */
  set(label: string): void {
    if (label === this.label) return;
    this.label = label;
    this.mounted?.refresh();
  }

  /** Clears the label while keeping the mounted editor attached. */
  clearLabel(): void {
    this.set("");
  }

  /** Attaches the live editor instance. */
  attach(editor: TokenSpeedEditor): void {
    this.mounted = editor;
  }

  /** Detaches the editor if it is still the mounted one. */
  detach(editor: TokenSpeedEditor): void {
    if (this.mounted === editor) this.mounted = undefined;
  }

  /** Clears the label and forgets the mounted editor. */
  clear(): void {
    this.label = "";
    this.mounted = undefined;
  }}

/**
 * Editor that keeps Pi's default behaviour and adds a right-aligned label on
 * the top border of the message input, e.g. `──── ⚡ TPS: 42.5 tok/s ─`.
 */
export class TokenSpeedEditor extends CustomEditor {
  /**
   * Creates the editor and registers it with the border status holder.
   *
   * @param borderStatus Label source shared with the renderer.
   * @param tui The TUI instance used for re-renders.
   * @param theme Editor theme (border colors and autocomplete styling).
   * @param keybindings App keybindings manager.
   * @param options Optional editor options.
   */
  constructor(
    private readonly borderStatus: EditorBorderStatus,
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
    options?: CustomEditorOptions,
  ) {
    super(tui, theme, keybindings, options);
    borderStatus.attach(this);
  }

  /** Requests a re-render without waiting for the next input event. */
  refresh(): void {
    this.tui.requestRender();
  }

  /** Detaches from the border status when Pi drops this editor. */
  dispose(): void {
    this.borderStatus.detach(this);
  }

  /**
   * Renders the top border with the label flush to the right edge.
   *
   * Falls back to the plain border when there is no label or when the terminal
   * is too narrow to fit it, so the input never renders a broken box.
   */
  protected renderTopBorder(width: number, hiddenLineCount: number): string {
    const label = this.borderStatus.get();
    const labelWidth = visibleWidth(label);
    const borderWidth = width - labelWidth - LABEL_CHROME;

    if (labelWidth === 0 || borderWidth < 1) {
      return super.renderTopBorder(width, hiddenLineCount);
    }

    return (
      super.renderTopBorder(borderWidth, hiddenLineCount) +
      this.borderColor(" ") +
      label +
      this.borderColor(" ─")
    );
  }
}

/**
 * Creates a Pi editor factory that mounts a {@link TokenSpeedEditor}.
 *
 * @param borderStatus Label holder shared with the renderer.
 * @returns Factory suitable for `ctx.ui.setEditorComponent()`.
 */
export function createTokenSpeedEditor(borderStatus: EditorBorderStatus) {
  return (
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
  ): TokenSpeedEditor =>
    new TokenSpeedEditor(borderStatus, tui, theme, keybindings);
}