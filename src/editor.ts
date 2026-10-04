// Swaps emoji in the editor (Live Preview and source mode).
//
// CodeMirror owns the editor's text, so instead of wrapping emoji ourselves we
// ask it to draw a mark over each one. The document is untouched and the
// cursor, selection, and undo all behave as usual.

import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { IMAGE_PROPERTY } from "./dom";
import { findEmoji } from "./match";

export const EDITOR_CLASS = "frankmoji-editor";

export function emojiEditorExtension(urlFor: (file: string) => string | undefined) {
  const marks = new Map<string, Decoration | null>();

  function markFor(file: string): Decoration | null {
    let mark = marks.get(file);
    if (mark === undefined) {
      const url = urlFor(file);
      mark = url
        ? Decoration.mark({
            class: EDITOR_CLASS,
            attributes: { style: `${IMAGE_PROPERTY}: url("${url}")` },
          })
        : null;
      marks.set(file, mark);
    }
    return mark;
  }

  function build(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      for (const match of findEmoji(view.state.sliceDoc(from, to))) {
        // Obsidian reads the "#" in the #️⃣ keycap as the start of a tag and
        // styles it in two pieces, which would draw the emoji twice.
        if (match.text.startsWith("#")) continue;
        const mark = markFor(match.file);
        if (!mark) continue;
        const start = from + match.index;
        builder.add(start, start + match.text.length, mark);
      }
    }
    return builder.finish();
  }

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = build(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = build(update.view);
        }
      }
    },
    { decorations: (value) => value.decorations },
  );
}
