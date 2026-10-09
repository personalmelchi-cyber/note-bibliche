import test from "node:test";
import assert from "node:assert/strict";
import { parseReference } from "./parse.js";
import { COLLISIONS, BOOKS, displayName } from "./books.js";
import { clean } from "./sources.js";

const ok = (input, n, chapter, from, to) => {
  const r = parseReference(input);
  assert.ok(r.book, `"${input}" doveva essere riconosciuto: ${JSON.stringify(r)}`);
  assert.equal(r.book.n, n, `"${input}" libro`);
  assert.equal(r.chapter, chapter, `"${input}" capitolo`);
  assert.equal(r.from, from, `"${input}" da`);
  assert.equal(r.to, to, `"${input}" a`);
};

test("riferimenti completi", () => {
  ok("Giovanni 3:16", 43, 3, 16, 16);
  ok("giovanni 3, 16", 43, 3, 16, 16);
  ok("Gv 3,16-18", 43, 3, 16, 18);
  ok("  Luca   1:76-80 ", 42, 1, 76, 80);
  ok("Vangelo secondo Luca 1:76-80", 42, 1, 76, 80);
  ok("Filippesi 4:13", 50, 4, 13, 13);
  ok("Salmo 23:1-3", 19, 23, 1, 3);
  ok("Sal 23.1", 19, 23, 1, 1);
});

test("capitolo intero", () => {
  ok("Salmo 23", 19, 23, null, null);
  ok("Luca 1", 42, 1, null, null);
});

test("libri numerati e abbreviazioni", () => {
  ok("1 Corinzi 13:4-7", 46, 13, 4, 7);
  ok("1Cor 13:4", 46, 13, 4, 4);
  ok("I Corinzi 13:4", 46, 13, 4, 4);
  ok("2 Tim 3:16", 55, 3, 16, 16);
  ok("1 Gv 4:8", 62, 4, 8, 8);
  ok("Apocalisse 21:4", 66, 21, 4, 4);
  ok("Gioele 2:28", 29, 2, 28, 28);
  ok("Isaia 53:5", 23, 53, 5, 5);
});

test("accenti e prefissi univoci", () => {
  ok("Giosuè 1:9", 6, 1, 9, 9);
  ok("giosue 1:9", 6, 1, 9, 9);
  ok("Matt 5:3", 40, 5, 3, 3);
  ok("Romani 8:28", 45, 8, 28, 28);
});

test("intervallo invertito viene sistemato", () => {
  ok("Giovanni 3:18-16", 43, 3, 16, 18);
});

test("errori", () => {
  assert.equal(parseReference("").error, "empty");
  assert.equal(parseReference("Pippo 3:16").error, "unknown");
  assert.equal(parseReference("Giovanni").error, "no-chapter");
  assert.equal(parseReference("Giovanni 0").error, "range");
});

test("inglese", () => {
  ok("John 3:16", 43, 3, 16, 16);
  ok("1 John 4:8", 62, 4, 8, 8);
  ok("Psalm 23", 19, 23, null, null);
  ok("Psalms 23:1-3", 19, 23, 1, 3);
  ok("Philippians 4:13", 50, 4, 13, 13);
  ok("Rev 21:4", 66, 21, 4, 4);
  ok("Song of Solomon 2:4", 22, 2, 4, 4);
  ok("Gospel of Luke 1:76-80", 42, 1, 76, 80);
  ok("Isaiah 53:5", 23, 53, 5, 5);
  ok("Gen 1:1", 1, 1, 1, 1);
});

test("ucraino", () => {
  ok("Іван 3:16", 43, 3, 16, 16);
  ok("Івана 3:16", 43, 3, 16, 16);
  ok("Від Івана 3:16", 43, 3, 16, 16);
  ok("Євангеліє від Луки 1:76-80", 42, 1, 76, 80);
  ok("Лука 1:76", 42, 1, 76, 76);
  ok("Псалом 23", 19, 23, null, null);
  ok("Филип'ян 4:13", 50, 4, 13, 13);
  ok("Об'явлення 21:4", 66, 21, 4, 4);
  ok("1 Коринтян 13:4-7", 46, 13, 4, 7);
  ok("Бут 1:1", 1, 1, 1, 1);
  ok("Матвій 5:3", 40, 5, 3, 3);
});

test("nomi dei libri nella lingua della traduzione", () => {
  const luke = BOOKS[41], ps = BOOKS[18];
  assert.equal(displayName(luke, "it"), "Vangelo secondo Luca");
  assert.equal(displayName(luke, "en"), "Luke");
  assert.equal(displayName(luke, "uk"), "Євангеліє від Луки");
  assert.equal(displayName(ps, "en"), "Psalm");
  assert.equal(displayName(ps, "uk"), "Псалом");
});

test("nessuna abbreviazione punta a due libri diversi", () => {
  assert.deepEqual(COLLISIONS, []);
});

test("pulizia del testo: numeri di Strong via, parole vere no", () => {
  assert.equal(clean("For God<S>2316</S> so<S>3779</S> loved<S>25</S>"), "For God so loved");
  assert.equal(clean("<S>G2316</S>Бог<br/>кохав"), "Бог кохав");
  // se un tag <S> contenesse parole, non vanno perse
  assert.equal(clean("<S>loved</S> the world"), "loved the world");
});
