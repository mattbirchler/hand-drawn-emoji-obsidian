import { App, PluginSettingTab, Setting } from "obsidian";
import type FrankMojiPlugin from "./main";

export interface FrankMojiSettings {
  enabled: boolean;
}

export const DEFAULT_SETTINGS: FrankMojiSettings = {
  enabled: true,
};

export class FrankMojiSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: FrankMojiPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Replace emoji")
      .setDesc("Turn off to go back to your system's emoji. Your notes are never changed either way.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enabled).onChange((value) => this.plugin.setEnabled(value)),
      );

    const about = containerEl.createEl("p", { cls: "frankmoji-about" });
    about.appendText("The emoji artwork is ");
    about.createEl("a", { text: "FrankMoji", href: "https://frankmoji.com/" });
    about.appendText(" © 2026 by Frank Rausch, used unmodified under the ");
    about.createEl("a", {
      text: "CC BY-NC-ND 4.0",
      href: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    });
    about.appendText(" license. The set has no flags or family emoji, so those stay as they are.");

    containerEl.createEl("p", {
      cls: "frankmoji-about",
      text: "This is not an official FrankMoji plugin. It is an independent project that is not made, sponsored, or endorsed by Frank Rausch.",
    });
  }
}
