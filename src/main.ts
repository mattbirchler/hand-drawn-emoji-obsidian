import { Notice, Plugin } from "obsidian";
import type { Extension } from "@codemirror/state";
import { DomReplacer } from "./dom";
import { loadEmbeddedPack } from "./embedded-pack";
import { EMOJI_SUPPORTED } from "./match";
import { EmojiPack } from "./pack";
import { DEFAULT_SETTINGS, FrankMojiSettingTab, FrankMojiSettings } from "./settings";

export default class FrankMojiPlugin extends Plugin {
  settings: FrankMojiSettings = DEFAULT_SETTINGS;
  private pack = new EmojiPack(loadEmbeddedPack);
  private dom = new DomReplacer((file) => this.pack.urlFor(file));
  private editorExtensions: Extension[] = [];

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new FrankMojiSettingTab(this.app, this));

    if (!EMOJI_SUPPORTED) {
      new Notice("FrankMoji needs a newer version of Obsidian. Install the latest version from obsidian.md, then try again.");
      return;
    }

    this.addCommand({
      id: "toggle",
      name: "Turn on or off",
      callback: () => this.setEnabled(!this.settings.enabled),
    });

    this.registerEditorExtension(this.editorExtensions);

    // The observer in dom.ts covers notes on screen. This covers notes rendered
    // off screen, such as PDF exports.
    this.registerMarkdownPostProcessor((el) => {
      if (this.settings.enabled) this.dom.processTree(el);
    });

    this.registerEvent(
      this.app.workspace.on("window-open", (_, win) => {
        if (this.settings.enabled) this.dom.attach(win.document);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("window-close", (_, win) => this.dom.detach(win.document)),
    );

    this.app.workspace.onLayoutReady(() => this.apply());
  }

  onunload() {
    this.dom.detachAll();
    this.pack.destroy();
  }

  async setEnabled(enabled: boolean) {
    if (enabled === this.settings.enabled) return;
    this.settings.enabled = enabled;
    await this.saveData(this.settings);
    this.apply();
  }

  private apply() {
    if (!EMOJI_SUPPORTED) return;
    this.editorExtensions.length = 0;
    if (this.settings.enabled) {
      for (const doc of this.openDocuments()) this.dom.attach(doc);
    } else {
      this.dom.detachAll();
    }
    this.app.workspace.updateOptions();
  }

  /** The main window plus any popout windows. */
  private openDocuments(): Set<Document> {
    const docs = new Set<Document>([document]);
    this.app.workspace.iterateAllLeaves((leaf) => {
      docs.add(leaf.view.containerEl.ownerDocument);
    });
    return docs;
  }
}
