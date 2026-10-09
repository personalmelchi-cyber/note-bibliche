import { blockHtml } from "./blocks.js";

// Testo formattato: grassetto, corsivo, barrato, elenchi ed evidenziatore.
// Il testo si salva come HTML "pulito": solo i tag qui sotto, tutto il resto viene tolto
// (anche quando si incolla da altre app), così la nota resta ordinata e sicura.

// Colori dell'evidenziatore: tenui, con trasparenza, così vanno bene sia sul tema chiaro sia sullo scuro.
export const PALETTE = {
  yellow: { label: "Giallo", rgb: [255, 214, 10] },
  green: { label: "Verde", rgb: [52, 199, 89] },
  blue: { label: "Blu", rgb: [10, 132, 255] },
  pink: { label: "Rosa", rgb: [255, 100, 170] },
  red: { label: "Rosso", rgb: [255, 69, 58] },
  orange: { label: "Arancione", rgb: [255, 159, 10] },
};
const ALPHA = 0.35;
export const highlightCss = (name) => `rgba(${PALETTE[name].rgb.join(", ")}, ${ALPHA})`;

function colorName(value) {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value || "");
  if (!m) return null;
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  for (const [name, { rgb }] of Object.entries(PALETTE)) {
    if (rgb[0] === r && rgb[1] === g && rgb[2] === b) return name;
  }
  return null;
}

const mk = (tag) => document.createElement(tag);

function walk(src, dst) {
  for (const n of [...src.childNodes]) {
    if (n.nodeType === 3) {
      dst.appendChild(document.createTextNode(n.nodeValue));
      continue;
    }
    if (n.nodeType !== 1) continue;
    let el = null;
    switch (n.tagName) {
      case "B":
      case "STRONG":
        el = mk("b");
        break;
      case "I":
      case "EM":
        el = mk("i");
        break;
      case "S":
      case "STRIKE":
      case "DEL":
        el = mk("s");
        break;
      case "UL":
        el = mk("ul");
        break;
      case "OL":
        el = mk("ol");
        break;
      case "LI":
        el = mk("li");
        break;
      case "BR":
        dst.appendChild(mk("br"));
        continue;
      case "DIV":
      case "P":
        walk(n, dst);
        if (n.nextSibling) dst.appendChild(mk("br"));
        continue;
      case "SCRIPT":
      case "STYLE":
        continue;
      default:
        break; // tag non ammesso: si tiene il contenuto, si toglie il tag
    }
    // Il browser può mettere l'evidenziatore su qualsiasi tag (anche <i> o <b>): lo si riporta in un <span>.
    const color = colorName(n.style && n.style.backgroundColor);
    let inner = el;
    if (color) {
      const span = mk("span");
      span.setAttribute("style", `background-color: ${highlightCss(color)}`);
      if (el) el.appendChild(span);
      inner = span;
    }
    if (el || inner) {
      walk(n, inner);
      dst.appendChild(el || inner);
    } else {
      walk(n, dst);
    }
  }
}

/** Testo semplice di un HTML (per ricerca e anteprima). */
export function htmlToText(html) {
  const d = mk("div");
  d.innerHTML = html;
  let out = "";
  const nl = () => {
    if (out && !out.endsWith("\n")) out += "\n";
  };
  const go = (node) => {
    for (const c of node.childNodes) {
      if (c.nodeType === 3) out += c.nodeValue;
      else if (c.nodeType === 1) {
        if (c.tagName === "BR") out += "\n";
        else if (c.tagName === "UL" || c.tagName === "OL") {
          nl();
          let i = 0;
          for (const li of c.children) {
            nl();
            out += c.tagName === "OL" ? `${++i}. ` : "• ";
            go(li);
          }
          nl();
        } else go(c);
      }
    }
  };
  go(d);
  return out.replace(/ /g, " ").replace(/\n+$/, "");
}

/** Pulisce un HTML qualsiasi. Se non c'è testo visibile ritorna "". */
export function cleanHtml(html) {
  if (!html) return "";
  const src = mk("div");
  src.innerHTML = html;
  const dst = mk("div");
  walk(src, dst);
  // formattazioni rimaste vuote
  for (const e of [...dst.querySelectorAll("b,i,s,span")].reverse()) {
    if (!e.firstChild) e.remove();
  }
  const out = dst.innerHTML;
  return htmlToText(out).trim() ? out : "";
}

const measure = (frag) => {
  let n = 0;
  const w = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let c;
  while ((c = w.nextNode())) {
    if (c.nodeType === 3) n += c.nodeValue.length;
    else if (c.tagName === "BR") n += 1;
  }
  return n;
};

/** Posizione del cursore dentro `root` (caratteri; un a-capo conta 1). null se il cursore è altrove. */
export function getOffset(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(r.startContainer, r.startOffset);
  return measure(pre.cloneContents());
}

function pointAt(root, pos) {
  if (pos <= 0) return [root, 0];
  let remaining = pos;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let c;
  while ((c = w.nextNode())) {
    if (c.nodeType === 3) {
      const len = c.nodeValue.length;
      if (remaining <= len) return [c, remaining];
      remaining -= len;
    } else if (c.tagName === "BR") {
      remaining -= 1;
      if (remaining <= 0) {
        const p = c.parentNode;
        return [p, Array.prototype.indexOf.call(p.childNodes, c) + 1];
      }
    }
  }
  return [root, root.childNodes.length];
}

/** Inizio e fine della selezione dentro `root` (stesso conteggio di getOffset). */
export function getRange(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  const upto = (node, off) => {
    const pre = document.createRange();
    pre.selectNodeContents(root);
    pre.setEnd(node, off);
    return measure(pre.cloneContents());
  };
  return { start: upto(r.startContainer, r.startOffset), end: upto(r.endContainer, r.endOffset) };
}

/** Rimette la selezione dopo un comando che l'ha spostata (il browser porta il cursore all'inizio). */
export function setRange(root, start, end = start) {
  const [sn, so] = pointAt(root, start);
  const [en, eo] = pointAt(root, end);
  const r = document.createRange();
  r.setStart(sn, so);
  r.setEnd(en, eo);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

/** Mette il cursore alla posizione `pos` (stesso conteggio di getOffset). */
export function setCaret(root, pos) {
  const [n, o] = pointAt(root, pos);
  const r = document.createRange();
  r.setStart(n, o);
  r.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

const ser = (frag) => {
  const t = mk("div");
  t.appendChild(frag);
  return t.innerHTML;
};

/**
 * Spezza un blocco di testo in due nel punto `pos`, tenendo la formattazione.
 * Ritorna { before, after }, ognuno { html, text }, già ripuliti da spazi e a-capo ai bordi.
 */
export function splitBlock(block, pos) {
  const html = cleanHtml(blockHtml(block));
  const d = mk("div");
  d.innerHTML = html;
  const [n, o] = pointAt(d, pos);
  const a = document.createRange();
  a.selectNodeContents(d);
  a.setEnd(n, o);
  const b = document.createRange();
  b.selectNodeContents(d);
  b.setStart(n, o);
  const edge = "(?:<br>|\\s|&nbsp;)+";
  const before = cleanHtml(ser(a.cloneContents()).replace(new RegExp(edge + "$"), ""));
  const after = cleanHtml(ser(b.cloneContents()).replace(new RegExp("^" + edge), ""));
  return {
    before: { html: before, text: htmlToText(before) },
    after: { html: after, text: htmlToText(after) },
  };
}

/**
 * Fa scorrere la nota in modo che la riga in cui si scrive resti visibile,
 * sopra la barra di formattazione e sopra la tastiera.
 */
export function keepCaretVisible() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const node = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  const scroller = node?.closest?.("[data-scroll]");
  if (!scroller) return;

  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(false);
  let rect = range.getClientRects()[0] || range.getBoundingClientRect();
  if (!rect || (rect.height === 0 && rect.top === 0)) rect = node.getBoundingClientRect(); // riga vuota

  const vv = window.visualViewport;
  const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const bar = document.querySelector("[role=toolbar]");
  const barShown = bar && bar.parentElement.getAttribute("aria-hidden") === "false";
  const limit = Math.min(barShown ? bar.getBoundingClientRect().top : Infinity, visibleBottom) - 24;
  const topLimit = scroller.getBoundingClientRect().top + 8;

  if (rect.bottom > limit) scroller.scrollTop += rect.bottom - limit;
  else if (rect.top < topLimit) scroller.scrollTop -= topLimit - rect.top;
}
