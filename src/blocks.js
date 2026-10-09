// Una nota è una sequenza di blocchi: paragrafi di testo e versetti, in qualsiasi ordine.
//   blocks = [ {type:"text"}, {type:"verse"}, {type:"text"}, ... ]
// Regole (le garantisce normalizeBlocks):
//   - il primo e l'ultimo blocco sono sempre di testo, così si può scrivere sopra e sotto un versetto
//   - due blocchi di testo non restano mai attaccati: si fondono in uno

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const textBlock = (text = "") => ({ id: uid(), type: "text", text });
export const verseBlock = (verse) => ({ id: uid(), type: "verse", verse });

export function normalizeBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === "text" && last && last.type === "text") {
      out[out.length - 1] = { ...last, text: [last.text, b.text].filter(Boolean).join("\n") };
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
 * Ritorna i nuovi blocchi e dove mettere il cursore (all'inizio del testo sotto il versetto).
 */
export function insertVerse(blocks, cursor, verse) {
  let idx = cursor ? blocks.findIndex((b) => b.id === cursor.id && b.type === "text") : -1;
  let pos;
  if (idx === -1) {
    idx = blocks.length - 1; // l'ultimo blocco è sempre di testo
    pos = blocks[idx].text.length;
  } else {
    pos = Math.min(Math.max(cursor.pos ?? 0, 0), blocks[idx].text.length);
  }

  const b = blocks[idx];
  const before = b.text.slice(0, pos).replace(/\s+$/, "");
  const after = b.text.slice(pos).replace(/^\s+/, "");
  const afterBlock = textBlock(after);

  const next = [
    ...blocks.slice(0, idx),
    { ...b, text: before },
    verseBlock(verse),
    afterBlock,
    ...blocks.slice(idx + 1),
  ];
  return { blocks: normalizeBlocks(next), focus: { id: afterBlock.id, pos: 0 } };
}

export const removeBlock = (blocks, id) => normalizeBlocks(blocks.filter((b) => b.id !== id));

/** Converte le note salvate col vecchio formato (body + verses + bodyAfter). */
export function migrateNote(n) {
  if (Array.isArray(n.blocks)) return n;
  const verses = n.verses || [];
  const blocks = [textBlock(n.body || "")];
  verses.forEach((v, i) => {
    blocks.push(verseBlock(v));
    blocks.push(textBlock(i === verses.length - 1 ? n.bodyAfter || "" : ""));
  });
  const { body, verses: _v, bodyAfter, ...rest } = n;
  return { ...rest, title: n.title || "", blocks: normalizeBlocks(blocks) };
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

/** Riga di anteprima nell'elenco: primo testo scritto, altrimenti il primo versetto. */
export function notePreview(n) {
  const t = n.blocks.find((b) => b.type === "text" && b.text.trim());
  if (t) return t.text.trim().split("\n")[0];
  const v = n.blocks.find((b) => b.type === "verse");
  return v ? `📖 ${v.verse.human}` : "";
}
