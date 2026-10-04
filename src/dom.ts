// Swaps emoji in rendered notes and the rest of the app's interface.
//
// Each emoji gets wrapped in a span that keeps the original character (so
// copy, search, and screen readers still see the real emoji) but hides the
// glyph and paints the FrankMoji SVG as a background. Text the editor owns is
// left to the CodeMirror extension in editor.ts.

import { findEmoji } from "./match";

export const TEXT_CLASS = "frankmoji";
export const IMAGE_PROPERTY = "--frankmoji-image";

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "TITLE",
]);
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const SHOW_TEXT = 4;

interface Watch {
  observer: MutationObserver;
  pending: Set<Node>;
  scheduled: boolean;
}

export class DomReplacer {
  private watches = new Map<Document, Watch>();

  constructor(private urlFor: (file: string) => string | undefined) {}

  /** Replace emoji in a document now and keep up with changes to it. */
  attach(doc: Document): void {
    if (this.watches.has(doc) || !doc.body) return;
    const watch: Watch = {
      observer: new MutationObserver((mutations) => this.onMutations(doc, mutations)),
      pending: new Set(),
      scheduled: false,
    };
    this.watches.set(doc, watch);
    this.processTree(doc.body);
    watch.observer.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["contenteditable"],
    });
  }

  /** Stop watching a document and put its native emoji back. */
  detach(doc: Document): void {
    const watch = this.watches.get(doc);
    if (!watch) return;
    watch.observer.disconnect();
    watch.pending.clear();
    this.watches.delete(doc);
    if (doc.body) unwrap(doc.body);
  }

  detachAll(): void {
    for (const doc of [...this.watches.keys()]) this.detach(doc);
  }

  processTree(root: Node): void {
    if (root.nodeType === TEXT_NODE) {
      this.replaceInTextNode(root as Text);
      return;
    }
    if (root.nodeType !== ELEMENT_NODE) return;
    const walker = root.ownerDocument?.createTreeWalker(root, SHOW_TEXT);
    if (!walker) return;
    const texts: Text[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode as Text);
    for (const text of texts) this.replaceInTextNode(text);
  }

  private replaceInTextNode(textNode: Text): void {
    const text = textNode.nodeValue ?? "";
    const matches = findEmoji(text);
    if (matches.length === 0) return;
    const parent = textNode.parentElement;
    if (!parent || shouldSkip(parent)) return;

    // Popout windows have their own document, so build nodes in the one the text lives in.
    const doc = textNode.ownerDocument;
    const fragment = doc.createDocumentFragment();
    let last = 0;
    let changed = false;
    for (const match of matches) {
      const url = this.urlFor(match.file);
      if (!url) continue;
      if (match.index > last) fragment.append(text.slice(last, match.index));
      const span = doc.createElement("span");
      span.className = TEXT_CLASS;
      span.textContent = match.text;
      span.style.setProperty(IMAGE_PROPERTY, `url("${url}")`);
      fragment.append(span);
      last = match.index + match.text.length;
      changed = true;
    }
    if (!changed) return;
    if (last < text.length) fragment.append(text.slice(last));
    textNode.replaceWith(fragment);
  }

  private onMutations(doc: Document, mutations: MutationRecord[]): void {
    const watch = this.watches.get(doc);
    if (!watch) return;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => watch.pending.add(node));
      } else if (mutation.type === "characterData") {
        watch.pending.add(mutation.target);
      } else if (mutation.target.nodeType === ELEMENT_NODE) {
        // Renaming a file makes its title editable. Hand back plain text while
        // it is being edited and swap the emoji again afterward.
        const el = mutation.target as HTMLElement;
        if (el.isContentEditable) unwrap(el);
        else watch.pending.add(el);
      }
    }
    if (watch.pending.size > 0 && !watch.scheduled) {
      watch.scheduled = true;
      (doc.defaultView ?? window).requestAnimationFrame(() => this.flush(doc));
    }
  }

  private flush(doc: Document): void {
    const watch = this.watches.get(doc);
    if (!watch) return;
    watch.scheduled = false;
    const nodes = [...watch.pending];
    watch.pending.clear();
    for (const node of nodes) {
      if (node.isConnected) this.processTree(node);
    }
  }
}

function shouldSkip(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  // Rendered blocks inside the editor (callouts, tables, embeds) are marked
  // not editable and are safe to change. Anything else in there is CodeMirror's.
  let insideWidget = false;
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.classList.contains(TEXT_CLASS)) return true;
    if (node.namespaceURI === SVG_NAMESPACE) return true;
    if (node.getAttribute("contenteditable") === "false") insideWidget = true;
    if (node.classList.contains("cm-content") && !insideWidget) return true;
  }
  return false;
}

function unwrap(root: HTMLElement): void {
  const parents = new Set<Node>();
  root.querySelectorAll(`span.${TEXT_CLASS}`).forEach((span) => {
    if (span.parentNode) parents.add(span.parentNode);
    span.replaceWith(span.textContent ?? "");
  });
  for (const parent of parents) parent.normalize();
}
