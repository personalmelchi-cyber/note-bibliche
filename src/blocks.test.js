import test from "node:test";
import assert from "node:assert/strict";
import { insertVerse, legacyParagraphs, migrateNote, normalizeBlocks, removeBlock, textBlock, verseBlock, noteSearchText, notePreview } from "./blocks.js";

const verse = (human) => ({ human, version: "NR06", verses: [{ n: 1, t: "testo" }] });
const shape = (blocks) => blocks.map((b) => (b.type === "text" ? `T:${b.text}` : `V:${b.verse.human}`));

test("il versetto va nel punto del cursore e spezza il testo", () => {
  const a = textBlock("Prima Dopo");
  const { blocks, focus } = insertVerse([a], { id: a.id, pos: 6 }, verse("Gv 3:16"));
  assert.deepEqual(shape(blocks), ["T:Prima", "V:Gv 3:16", "T:Dopo"]);
  // il cursore va all'inizio del testo sotto il versetto
  assert.equal(blocks[2].id, focus.id);
  assert.equal(focus.pos, 0);
});

test("cursore a fine paragrafo: il versetto va sotto, resta uno spazio per scrivere", () => {
  const a = textBlock("Appunti");
  const { blocks } = insertVerse([a], { id: a.id, pos: 7 }, verse("A"));
  assert.deepEqual(shape(blocks), ["T:Appunti", "V:A", "T:"]);
});

test("cursore all'inizio: si può scrivere sopra il versetto", () => {
  const a = textBlock("Testo");
  const { blocks } = insertVerse([a], { id: a.id, pos: 0 }, verse("A"));
  assert.deepEqual(shape(blocks), ["T:", "V:A", "T:Testo"]);
});

test("secondo versetto: finisce dopo il testo scritto in mezzo, non sopra", () => {
  const a = textBlock("Uno");
  const first = insertVerse([a], { id: a.id, pos: 3 }, verse("A"));
  const tail = first.blocks[2];
  const typed = first.blocks.map((b) => (b.id === tail.id ? { ...b, text: "Mio appunto" } : b));
  const second = insertVerse(typed, { id: tail.id, pos: "Mio appunto".length }, verse("B"));
  assert.deepEqual(shape(second.blocks), ["T:Uno", "V:A", "T:Mio appunto", "V:B", "T:"]);
});

test("versetto in mezzo a due versetti esistenti", () => {
  const a = textBlock("");
  const b = textBlock("fra");
  const blocks = [a, verseBlock(verse("A")), b, verseBlock(verse("B")), textBlock("fine")];
  const r = insertVerse(blocks, { id: b.id, pos: 1 }, verse("X"));
  assert.deepEqual(shape(r.blocks), ["T:", "V:A", "T:f", "V:X", "T:ra", "V:B", "T:fine"]);
});

test("senza cursore noto o con blocco sparito: in fondo alla nota", () => {
  const a = textBlock("Uno");
  assert.deepEqual(shape(insertVerse([a], null, verse("A")).blocks), ["T:Uno", "V:A", "T:"]);
  assert.deepEqual(shape(insertVerse([a], { id: "inesistente", pos: 1 }, verse("A")).blocks), ["T:Uno", "V:A", "T:"]);
});

test("posizione del cursore oltre la fine viene limitata", () => {
  const a = textBlock("ab");
  assert.deepEqual(shape(insertVerse([a], { id: a.id, pos: 99 }, verse("A")).blocks), ["T:ab", "V:A", "T:"]);
});

test("togliendo un versetto i testi sopra e sotto si uniscono", () => {
  const a = textBlock("Sopra"), v = verseBlock(verse("A")), c = textBlock("Sotto");
  assert.deepEqual(shape(removeBlock([a, v, c], v.id)), ["T:Sopra\nSotto"]);
  const e = textBlock("");
  assert.deepEqual(shape(removeBlock([e, v, c], v.id)), ["T:Sotto"]);
});

test("normalizzazione: sempre testo in testa e in coda", () => {
  assert.deepEqual(shape(normalizeBlocks([verseBlock(verse("A"))])), ["T:", "V:A", "T:"]);
  assert.deepEqual(shape(normalizeBlocks([])), ["T:"]);
});

test("migrazione dal vecchio formato conserva l'ordine", () => {
  const old = { id: 1, title: "T", body: "corpo", verses: [verse("A"), verse("B")], bodyAfter: "dopo", updatedAt: 5 };
  const n = migrateNote(old);
  assert.deepEqual(shape(n.blocks), ["T:corpo", "V:A", "T:", "V:B", "T:dopo"]);
  assert.equal(n.title, "T");
  assert.equal(n.updatedAt, 5);
  assert.equal("body" in n, false);
  // una nota già nel nuovo formato non cambia
  assert.equal(migrateNote(n), n);
  // senza versetti
  assert.deepEqual(shape(migrateNote({ id: 2, title: "", body: "solo testo", verses: [], bodyAfter: "" }).blocks), ["T:solo testo"]);
});

test("ricerca e anteprima", () => {
  const n = { title: "Titolo", blocks: [textBlock("Uno\ndue"), verseBlock(verse("Luca 1:76")), textBlock("")] };
  assert.ok(noteSearchText(n).includes("luca 1:76"));
  assert.ok(noteSearchText(n).includes("testo"));
  assert.equal(notePreview(n), "Luca 1:76 · Uno");
  assert.equal(notePreview({ title: "", blocks: [textBlock(""), verseBlock(verse("Luca 1:76")), textBlock("")] }), "Luca 1:76");
  assert.equal(notePreview({ title: "", blocks: [textBlock("Solo testo")] }), "Solo testo");
  assert.equal(notePreview({ title: "", blocks: [textBlock(""), verseBlock(verse("Vangelo secondo Giovanni 3:16")), textBlock("")] }), "Giovanni 3:16");
});

test("con testo formattato: il versetto spezza anche l'HTML con la funzione di divisione", () => {
  const a = { id: "a", type: "text", text: "Uno Due", html: "<b>Uno</b> Due" };
  const split = (b, pos) => ({
    before: { text: b.text.slice(0, pos).trim(), html: pos === 3 ? "<b>Uno</b>" : "" },
    after: { text: b.text.slice(pos).trim(), html: "Due" },
  });
  const { blocks } = insertVerse([a], { id: "a", pos: 3 }, verse("A"), split);
  assert.deepEqual(shape(blocks), ["T:Uno", "V:A", "T:Due"]);
  assert.equal(blocks[0].html, "<b>Uno</b>");
  assert.equal(blocks[2].html, "Due");
});

test("unendo testi formattati l'HTML si unisce con un a-capo", () => {
  const a = { id: "a", type: "text", text: "Su", html: "<b>Su</b>" };
  const v = verseBlock(verse("A"));
  const c = textBlock("Giù");
  const r = removeBlock([a, v, c], v.id);
  assert.equal(r.length, 1);
  assert.equal(r[0].html, "<b>Su</b><br>Giù");
});

test("vecchi a-capo diventano paragrafi, una sola volta", () => {
  const a = legacyParagraphs({ id: "a", type: "text", text: "uno\ndue", html: "uno\ndue" });
  assert.equal(a.html, "<p>uno</p><p>due</p>");
  assert.equal(legacyParagraphs(a), a); // già a paragrafi: non cambia
  const b = legacyParagraphs({ id: "b", type: "text", text: "x\n\ny" });
  assert.equal(b.html, "<p>x</p><p><br></p><p>y</p>");
  const solo = { id: "c", type: "text", text: "una riga" };
  assert.equal(legacyParagraphs(solo), solo);
  const elenco = { id: "d", type: "text", text: "a", html: "<ul><li>a</li><li>b</li></ul>" };
  assert.equal(legacyParagraphs(elenco), elenco);
  // le note già salvate vengono portate a paragrafi al caricamento
  const n = migrateNote({ id: 1, title: "", blocks: [{ id: "e", type: "text", text: "p1\np2" }] });
  assert.equal(n.blocks[0].html, "<p>p1</p><p>p2</p>");
});

test("unendo testi a paragrafi restano paragrafi", () => {
  const a = { id: "a", type: "text", text: "Su", html: "<p>Su</p>" };
  const v = verseBlock(verse("A"));
  const c = textBlock("Giù");
  const r = removeBlock([a, v, c], v.id);
  assert.equal(r[0].html, "<p>Su</p><p>Giù</p>");
});
