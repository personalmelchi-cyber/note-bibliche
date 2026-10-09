import test from "node:test";
import assert from "node:assert/strict";
import { insertVerse, migrateNote, normalizeBlocks, removeBlock, textBlock, verseBlock, noteSearchText, notePreview } from "./blocks.js";

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
  assert.equal(notePreview(n), "Uno");
  assert.equal(notePreview({ title: "", blocks: [textBlock(""), verseBlock(verse("Luca 1:76")), textBlock("")] }), "📖 Luca 1:76");
});
