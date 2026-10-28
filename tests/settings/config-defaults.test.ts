import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createSettings } from "../../src/config/settings";

const AGENT_DIR_ENV = "PI_CODING_AGENT_DIR";

describe("Settings placement default", () => {
  let agentDir: string;
  let settingsPath: string;
  let previousAgentDir: string | undefined;

  const writeSettings = (contents: unknown): Promise<void> =>
    writeFile(settingsPath, JSON.stringify(contents));

  beforeEach(async () => {
    agentDir = await mkdtemp(join(tmpdir(), "pi-token-speed-"));
    settingsPath = join(agentDir, "settings.json");
    previousAgentDir = process.env[AGENT_DIR_ENV];
    process.env[AGENT_DIR_ENV] = agentDir;
  });

  afterEach(async () => {
    if (previousAgentDir === undefined) delete process.env[AGENT_DIR_ENV];
    else process.env[AGENT_DIR_ENV] = previousAgentDir;
    await rm(agentDir, { recursive: true, force: true });
  });

  it("defaults to the footer when no settings file exists", async () => {
    const config = await createSettings().initialize();

    expect(config.placement).toBe("footer");
  });

  it("defaults to the footer when the tokenSpeed block omits placement", async () => {
    await writeSettings({ tokenSpeed: { display: "full" } });

    const config = await createSettings().initialize();

    expect(config.placement).toBe("footer");
  });

  it("corrects an invalid placement back to the footer", async () => {
    await writeSettings({ tokenSpeed: { placement: "sidebar" } });
    const settings = createSettings();

    const config = await settings.initialize();

    expect(config.placement).toBe("footer");
    expect(settings.getErrors().join("\n")).toContain(
      'Invalid placement "sidebar"',
    );
  });

  it("keeps an explicit border placement", async () => {
    await writeSettings({ tokenSpeed: { placement: "border" } });

    const config = await createSettings().initialize();

    expect(config.placement).toBe("border");
  });
});