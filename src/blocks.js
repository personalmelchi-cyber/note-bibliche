// Una nota è una sequenza di blocchi: paragrafi di testo e versetti, in qualsiasi ordine.
//   blocks = [ {type:"text"}, {type:"verse"}, {type:"text"}, ... ]
// Regole (le garantisce normalizeBlocks):
//   - il primo e l'ultimo blocco sono sempre di testo, così si può scrivere sopra e sotto un versetto
//   - due blocchi di testo non restano mai attaccati: si fondono in uno

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const textBlock = (text = "", html) => (html === undefined ? { id: uid(), type: "text", text } : { id: uid(), type: "text", text, html });
export const verseBlock = (verse) => ({ id: uid(), type: "verse", verse });

export const escapeHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Riferimento breve, senza "Vangelo secondo": "Giovanni 3:16". */
export const verseLabel = (verse) => verse.human.replace(/^(Vangelo secondo|Євангеліє від)\s+/i, "");

/** HTML del testo di un versetto: numeri in apice + testo. Se è stato evidenziato si usa quello salvato. */
export const verseHtml = (verse) =>
  typeof verse.html === "string" ? verse.html : verse.verses.map((v) => `<sup>${v.n}</sup>${escapeHtml(v.t)} `).join("");

/** HTML di un blocco di testo: quello formattato se c'è, altrimenti il testo semplice. */
export const blockHtml = (b) => (typeof b.html === "string" ? b.html : escapeHtml(b.text || "").replace(/\n/g, "<br>"));

const asParagraph = (h) => (!h || /^<p[\s>]/.test(h) ? h : `<p>${h}</p>`);

/**
 * Le note scritte prima dei paragrafi vanno a capo con "\n" o <br>: ogni a-capo era un Invio,
 * quindi diventa un paragrafo (così prende la spaziatura tra paragrafi). Se non serve, ritorna lo stesso blocco.
 */
export function legacyParagraphs(b) {
  if (b.type !== "text") return b;
  const src = typeof b.html === "string" ? b.html : escapeHtml(b.text || "");
  if (/<p[\s>]|<ul|<ol/i.test(src) || !/\n|<br/i.test(src)) return b;
  const parts = src.split(/\n|<br\s*\/?>/i);
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  if (parts.length < 2) return b;
  return { ...b, html: parts.map((x) => `<p>${x || "<br>"}</p>`).join("") };
}

export function normalizeBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === "text" && last && last.type === "text") {
      const merged = { ...last, text: [last.text, b.text].filter(Boolean).join("\n") };
      if (typeof last.html === "string" || typeof b.html === "string") {
        const [x, y] = [blockHtml(last), blockHtml(b)];
        // con i paragrafi si uniscono come paragrafi, altrimenti con un a-capo
        merged.html = /<p[\s>]/.test(x + y) ? asParagraph(x) + asParagraph(y) : [x, y].filter(Boolean).join("<br>");
      }
      out[out.length - 1] = merged;
    } else {
      out.push(b);
    }
  }
  if (!out.length || out[0].type !== "text") out.unshift(textBlock());
  if (out[out.length - 1].type !== "text") out.push(textBlock());
  return out;
}

/**
 * Inserisce un versetto nel punto del cursore.
 * `cursor` = { id, pos }: blocco di testo e posizione del cursore al suo interno.
 * Il testo prima del cursore resta sopra il versetto, quello dopo passa sotto.
 * Se il cursore non è noto, il versetto va in fondo alla nota.
 * `split(block, pos)` (facoltativo) spezza anche il testo formattato: ritorna {before, after} con {text, html}.
 * Ritorna i nuovi blocchi e dove mettere il cursore (all'inizio del testo sotto il versetto).
 */
export function insertVerse(blocks, cursor, verse, split) {
  let idx = cursor ? blocks.findIndex((b) => b.id === cursor.id && b.type === "text") : -1;
  let pos;
  if (idx === -1) {
    idx = blocks.length - 1; // l'ultimo blocco è sempre di testo
    pos = split ? Number.MAX_SAFE_INTEGER : blocks[idx].text.length;
  } else {
    // con il testo formattato le posizioni si contano nel DOM: il limite lo gestisce `split`
    pos = Math.max(cursor.pos ?? 0, 0);
    if (!split) pos = Math.min(pos, blocks[idx].text.length);
  }

  const b = blocks[idx];
  let beforePart, afterBlock;
  if (split) {
    const r = split(b, pos);
    beforePart = { text: r.before.text, html: r.before.html };
    afterBlock = textBlock(r.after.text, r.after.html);
  } else {
    beforePart = { text: b.text.slice(0, pos).replace(/\s+$/, "") };
    afterBlock = textBlock(b.text.slice(pos).replace(/^\s+/, ""));
  }

  const next = [
    ...blocks.slice(0, idx),
    { ...b, ...beforePart },
    verseBlock(verse),
    afterBlock,
    ...blocks.slice(idx + 1),
  ];
  return { blocks: normalizeBlocks(next), focus: { id: afterBlock.id, pos: 0 } };
}

export const removeBlock = (blocks, id) => normalizeBlocks(blocks.filter((b) => b.id !== id));

/** Converte le note salvate col vecchio formato (body + verses + bodyAfter) e porta i testi a paragrafi. */
export function migrateNote(n) {
  if (Array.isArray(n.blocks)) {
    const blocks = n.blocks.map(legacyParagraphs);
    return blocks.some((b, i) => b !== n.blocks[i]) ? { ...n, blocks } : n;
  }
  const verses = n.verses || [];
  const blocks = [textBlock(n.body || "")];
  verses.forEach((v, i) => {
    blocks.push(verseBlock(v));
    blocks.push(textBlock(i === verses.length - 1 ? n.bodyAfter || "" : ""));
  });
  const { body, verses: _v, bodyAfter, ...rest } = n;
  return { ...rest, title: n.title || "", blocks: normalizeBlocks(blocks).map(legacyParagraphs) };
}

/** Tutto il testo di una nota, per la ricerca. */
export function noteSearchText(n) {
  const parts = [n.title];
  for (const b of n.blocks) {
    if (b.type === "text") parts.push(b.text);
    else parts.push(b.verse.human, ...b.verse.verses.map((v) => v.t));
  }
  return parts.join("\n").toLowerCase();
}

/** Riga di anteprima nell'elenco: primo versetto citato e primo testo scritto ("Giovanni 3:16 · la grazia…"). */
export function notePreview(n) {
  const v = n.blocks.find((b) => b.type === "verse");
  const t = n.blocks.find((b) => b.type === "text" && b.text.trim());
  const snippet = t ? t.text.trim().split("\n")[0] : "";
  return [v ? verseLabel(v.verse) : "", snippet].filter(Boolean).join(" · ");
}
