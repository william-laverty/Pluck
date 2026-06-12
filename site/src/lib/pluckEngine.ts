/**
 * Browser-side port of Pluck's selector engine core, scoped to a playground
 * root — the same algorithm the extension ships (verified uniqueness, junk-
 * class filtering, :nth-of-type only when needed), trimmed to what the live
 * demo exercises. Source of truth: src/content/selector.js in the repo root.
 */

const MAX_DEPTH = 8;
const MAX_CLASSES = 4;

export function isJunkClass(cls: string): boolean {
  if (!cls) return true;
  if (/^css-[a-z0-9]{4,}$/i.test(cls)) return true;
  if (/^sc-[a-zA-Z0-9]{5,}$/.test(cls)) return true;
  if (/^e[a-z0-9]{8,}$/i.test(cls) && /\d/.test(cls)) return true;
  if (/^jsx-\d+$/.test(cls)) return true;
  if (/^[a-z]{1,4}[-_]?[a-f0-9]{6,}$/i.test(cls) && /\d/.test(cls)) return true;
  if (/^[a-f0-9]{6,}$/i.test(cls)) return true;
  if (/^\d+$/.test(cls)) return true;
  return false;
}

function meaningfulClasses(el: Element, cap: number): string[] {
  return Array.from(el.classList).filter((c) => !isJunkClass(c)).slice(0, cap);
}

function tagOf(el: Element): string {
  return el.namespaceURI && el.namespaceURI !== "http://www.w3.org/1999/xhtml"
    ? el.tagName
    : el.tagName.toLowerCase();
}

function esc(ident: string): string {
  return CSS.escape(ident);
}

function classSegment(el: Element, cap: number): string {
  return tagOf(el) + meaningfulClasses(el, cap).map((c) => "." + esc(c)).join("");
}

function nthOfType(el: Element): number | null {
  const parent = el.parentElement;
  if (!parent) return null;
  let index = 0;
  let count = 0;
  for (const kid of Array.from(parent.children)) {
    if (kid.tagName === el.tagName) {
      count++;
      if (kid === el) index = count;
    }
  }
  return count > 1 ? index : null;
}

function matchesOnly(selector: string, el: Element, root: ParentNode): boolean {
  if (!selector) return false;
  try {
    const nodes = root.querySelectorAll(selector);
    return nodes.length === 1 && nodes[0] === el;
  } catch {
    return false;
  }
}

function usableId(el: Element): string | null {
  const id = el.id;
  if (!id || /\s/.test(id) || isJunkClass(id)) return null;
  return id;
}

export function headlineFor(el: Element): string {
  let seg = tagOf(el);
  const id = usableId(el);
  if (id) seg += "#" + esc(id);
  return seg + meaningfulClasses(el, MAX_CLASSES).map((c) => "." + esc(c)).join("");
}

export function buildSelector(el: Element, root: ParentNode) {
  const segments: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  let unique = "";

  while (node && node !== root && depth < MAX_DEPTH) {
    const id = usableId(node);
    const idSel = id ? tagOf(node) + "#" + esc(id) : null;
    if (idSel && matchesOnly(idSel, node, root)) {
      segments.unshift(idSel);
      const anchored = segments.join(" > ");
      if (matchesOnly(anchored, el, root)) return { headline: headlineFor(el), unique: anchored, isUnique: true };
    } else {
      segments.unshift(classSegment(node, MAX_CLASSES));
    }

    unique = segments.join(" > ");
    if (matchesOnly(unique, el, root)) return { headline: headlineFor(el), unique, isUnique: true };

    const nth = nthOfType(node);
    if (nth) {
      segments[0] = segments[0] + `:nth-of-type(${nth})`;
      unique = segments.join(" > ");
      if (matchesOnly(unique, el, root)) return { headline: headlineFor(el), unique, isUnique: true };
    }

    node = node.parentElement;
    depth++;
  }

  unique = segments.join(" > ");
  return { headline: headlineFor(el), unique, isUnique: matchesOnly(unique, el, root) };
}
