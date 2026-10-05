import { App, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import type FrankMojiPlugin from "./main";

export interface FrankMojiSettings {
  enabled: boolean;
}

export const DEFAULT_SETTINGS: FrankMojiSettings = {
  enabled: true,
};

const REPLACE_NAME = "Replace emoji";
const REPLACE_DESC = "Turn off to go back to your system's emoji. Your notes are never changed either way.";
const ARTWORK_NAME = "Emoji artwork";
const UNOFFICIAL_NAME = "Not an official FrankMoji plugin";
const UNOFFICIAL_DESC = "This is an independent project that is not made, sponsored, or endorsed by Frank Rausch.";

function artworkCredit(): DocumentFragment {
  return createFragment((credit) => {
    credit.appendText("The emoji artwork is ");
    credit.createEl("a", { text: "FrankMoji", href: "https://frankmoji.com/" });
    credit.appendText(" © 2026 by Frank Rausch, used unmodified under the ");
    credit.createEl("a", {
      text: "CC BY-NC-ND 4.0",
      href: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    });
    credit.appendText(" license. The set has no flags or family emoji, so those stay as they are.");
  });
}

export class FrankMojiSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: FrankMojiPlugin) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: REPLACE_NAME,
        desc: REPLACE_DESC,
        control: { type: "toggle", key: "enabled", defaultValue: DEFAULT_SETTINGS.enabled },
      },
      { name: ARTWORK_NAME, desc: artworkCredit() },
      { name: UNOFFICIAL_NAME, desc: UNOFFICIAL_DESC },
    ];
  }

  getControlValue(key: string): unknown {
    return this.plugin.settings[key as keyof FrankMojiSettings];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === "enabled") await this.plugin.setEnabled(Boolean(value));
  }

  // Obsidian 1.13 and later draw the tab from getSettingDefinitions(). This is
  // the same page for older versions.
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(REPLACE_NAME)
      .setDesc(REPLACE_DESC)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enabled).onChange((value) => this.plugin.setEnabled(value)),
      );
    new Setting(containerEl).setName(ARTWORK_NAME).setDesc(artworkCredit());
    new Setting(containerEl).setName(UNOFFICIAL_NAME).setDesc(UNOFFICIAL_DESC);
  }
}
