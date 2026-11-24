/**
 * Finds words on the page and measures where they are, so the tutor can draw on them.
 * Browser-only (uses the DOM). Drawing is anchored to the real rendered text, never to pixel guesses,
 * so it follows the text through resizes and different screen sizes.
 */
import type { Mark } from "./tutor-lesson";

export type Box = { x: number; y: number; w: number; h: number };
export type Regions = { left: HTMLElement | null; right: HTMLElement | null };

/** Where the practice screen keeps things. Passage (or lone question) on the left, stem and choices on the right. */
export function getRegions(doc: Document = document): Regions {
  return {
    left: doc.querySelector<HTMLElement>('section[aria-label="Passage"], section[aria-label="Question"]'),
    right: doc.querySelector<HTMLElement>('section[aria-label="Answer"]'),
  };
}

const HOST_ATTR = "data-tutor-host";

/** A layer that scrolls with the region's content. Created on demand, removed by `removeHosts`. */
export function ensureHost(region: HTMLElement): HTMLElement {
  const found = region.querySelector<HTMLElement>(`:scope > [${HOST_ATTR}]`);
  if (found) return found;
  if (getComputedStyle(region).position === "static") {
    region.style.position = "relative";
    region.setAttribute("data-tutor-positioned", "1");
  }
  const host = region.ownerDocument.createElement("div");
  host.setAttribute(HOST_ATTR, "");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:5";
  region.appendChild(host);
  return host;
}

export function removeHosts(regions: Regions) {
  for (const r of [regions.left, regions.right]) {
    if (!r) continue;
    r.querySelectorAll(`:scope > [${HOST_ATTR}]`).forEach((h) => h.remove());
    if (r.getAttribute("data-tutor-positioned")) {
      r.style.position = "";
      r.removeAttribute("data-tutor-positioned");
    }
  }
}

// ----------------------------------------------------------- text matching

const DASH = /[‐-―−]/;
const ZERO = /[​-‍﻿­]/;
const SPACE = /\s| /;

/** One character in, one character out (so positions line up), except that zero-width characters vanish. */
function foldChar(c: string): string {
  if (/[‘’‚′]/.test(c)) return "'";
  if (/[“”„″]/.test(c)) return '"';
  if (DASH.test(c)) return "-";
  const l = c.toLowerCase();
  return l.length === 1 ? l : c;
}

type Index = { text: string; at: { node: Text; off: number }[] };

function buildIndex(root: Element, squash: boolean): Index {
  const out: string[] = [];
  const at: Index["at"] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(`[${HOST_ATTR}]`) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const s = n.data;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (ZERO.test(c)) continue;
      if (SPACE.test(c)) {
        if (squash || !out.length || out[out.length - 1] === " ") continue;
        out.push(" ");
        at.push({ node: n, off: i });
        continue;
      }
      out.push(foldChar(c));
      at.push({ node: n, off: i });
    }
  }
  return { text: out.join(""), at };
}

function foldQuote(q: string, squash: boolean): string {
  const out: string[] = [];
  for (const c of q) {
    if (ZERO.test(c)) continue;
    if (SPACE.test(c)) {
      if (!squash && out.length && out[out.length - 1] !== " ") out.push(" ");
      continue;
    }
    out.push(foldChar(c));
  }
  return out.join("").trim();
}

function toRange(root: Element, idx: Index, from: number, len: number): Range {
  const a = idx.at[from], b = idx.at[from + len - 1];
  const r = root.ownerDocument.createRange();
  r.setStart(a.node, a.off);
  r.setEnd(b.node, b.off + 1);
  return r;
}

/**
 * The words `quote` as a DOM Range inside `root`, or null. Forgiving about case, curly quotes, dashes and
 * spacing (KaTeX math has no spaces between symbols, so a second pass ignores spaces completely).
 */
export function findQuote(root: Element, quote: string): Range | null {
  const tries: string[] = [quote];
  const trimmed = quote.replace(/^[\s.,;:!?"'“”‘’()[\]…-]+|[\s.,;:!?"'“”‘’()[\]…-]+$/g, "");
  if (trimmed && trimmed !== quote) tries.push(trimmed);
  const parts = quote.split(/\.{3}|…/).map((p) => p.trim()).filter((p) => p.split(/\s+/).length >= 2);
  if (parts.length > 1) tries.push(parts[0]);

  for (const squash of [false, true]) {
    const idx = buildIndex(root, squash);
    for (const t of tries) {
      const q = foldQuote(t, squash);
      if (q.length < 1) continue;
      const i = idx.text.indexOf(q);
      if (i >= 0) return toRange(root, idx, i, q.length);
    }
  }
  return null;
}

// ----------------------------------------------------------------- geometry

/** A client rect → coordinates inside `host`'s scrolling content (so it moves with the content when scrolled). */
function rel(r: { left: number; top: number; width: number; height: number }, host: HTMLElement): Box {
  const h = host.getBoundingClientRect();
  return { x: r.left - h.left - host.clientLeft + host.scrollLeft, y: r.top - h.top - host.clientTop + host.scrollTop, w: r.width, h: r.height };
}

/** One box per line of text the range covers. */
export function lineBoxes(range: Range, host: HTMLElement): Box[] {
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0.5 && r.height > 0.5);
  rects.sort((a, b) => a.top - b.top || a.left - b.left);
  const lines: { left: number; right: number; top: number; bottom: number }[] = [];
  for (const r of rects) {
    const last = lines[lines.length - 1];
    const mid = r.top + r.height / 2;
    if (last && mid > last.top && mid < last.bottom) {
      last.left = Math.min(last.left, r.left);
      last.right = Math.max(last.right, r.right);
      last.top = Math.min(last.top, r.top);
      last.bottom = Math.max(last.bottom, r.bottom);
    } else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
  }
  return lines.map((l) => rel({ left: l.left, top: l.top, width: l.right - l.left, height: l.bottom - l.top }, host));
}

/** Where the content column starts inside a region, so margin numbers can sit just left of the text. */
export function gutterX(region: HTMLElement): number | null {
  const first = region.firstElementChild as HTMLElement | null;
  if (!first || first.hasAttribute(HOST_ATTR)) return null;
  return rel(first.getBoundingClientRect(), region).x;
}

/** The nearest ancestor that actually scrolls (the passage pane on desktop, the whole question area on a phone). */
function scrollerOf(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/** Scrolls `el` to the middle of its scroller, but only if it is not already comfortably visible (so stepping through marks that are all on screen never makes the page jump). */
export function revealIfHidden(el: HTMLElement, smooth: boolean) {
  const sc = scrollerOf(el);
  const r = el.getBoundingClientRect();
  const top = sc ? sc.getBoundingClientRect().top : 0;
  const bottom = sc ? sc.getBoundingClientRect().bottom : window.innerHeight;
  if (r.top >= top + 4 && r.bottom <= bottom - 4) return;
  el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
}

export type Anchored = { region: HTMLElement; boxes: Box[]; gutter: number | null };

/** Where on screen a mark goes, or null if its words can't be found (the lesson still works, just without that drawing). */
export function anchorMark(m: Mark, regions: Regions): Anchored | null {
  const { left, right } = regions;
  if (m.on === "choices" && m.choice) {
    if (!right) return null;
    const label = right.querySelectorAll<HTMLElement>("fieldset label")[m.choice.charCodeAt(0) - 65];
    if (!label) return null;
    if (m.quote) {
      const r = findQuote(label, m.quote);
      if (r) {
        const boxes = lineBoxes(r, right);
        if (boxes.length) return { region: right, boxes, gutter: gutterX(right) };
      }
    }
    return { region: right, boxes: [rel(label.getBoundingClientRect(), right)], gutter: gutterX(right) };
  }
  if (!m.quote) return null;
  const order = m.on === "stem" ? [right, left] : [left, right];
  for (const reg of order) {
    if (!reg) continue;
    const r = findQuote(reg, m.quote);
    if (!r) continue;
    const boxes = lineBoxes(r, reg);
    if (boxes.length) return { region: reg, boxes, gutter: gutterX(reg) };
  }
  return null;
}
