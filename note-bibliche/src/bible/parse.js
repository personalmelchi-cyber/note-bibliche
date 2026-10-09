import { findBook } from "./books.js";

// Prefissi che si possono scrivere davanti al libro e vanno ignorati.
const PREFIX =
  /^(?:(?:il\s+)?vangelo\s+(?:secondo|di)\s+|(?:the\s+)?gospel\s+(?:of|according\s+to)\s+|(?:the\s+)?book\s+of\s+|євангел\p{L}*\s+від\s+|від\s+)/iu;

/**
 * Trasforma testo libero in un riferimento, in italiano, inglese o ucraino.
 *   "Giovanni 3:16"  "gv 3,16-18"  "1 Cor 13:4-7"  "John 3:16"  "Іван 3:16"  "Salmo 23"
 * Ritorna { book, chapter, from, to } oppure { error, ... }.
 * Se manca il versetto, `from` e `to` sono null = capitolo intero.
 */
export function parseReference(input) {
  let s = (input || "").trim().replace(/\s+/g, " ");
  if (!s) return { error: "empty" };

  s = s.replace(PREFIX, "");
  // numeri romani iniziali: "I Corinzi" -> "1 Corinzi"
  // (lo spazio è obbligatorio, altrimenti "Isaia" diventerebbe "I saia")
  s = s.replace(/^(iii|ii|i)\.?\s+(?=\p{L})/iu, (m, r) => ({ i: "1", ii: "2", iii: "3" }[r.toLowerCase()] + " "));

  // [libro] [capitolo] [: versetto [- versetto]]
  const m = s.match(/^(.*?[\p{L}.'’])\s*(\d{1,3})(?:\s*[:,.]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?\s*$/iu);
  if (!m) {
    // solo il libro, senza capitolo: lo segnaliamo come incompleto
    return findBook(s.replace(/\.$/, "")).book ? { error: "no-chapter" } : { error: "unknown" };
  }

  const found = findBook(m[1].replace(/\.$/, ""));
  if (!found.book) return found;

  const chapter = parseInt(m[2], 10);
  let from = m[3] ? parseInt(m[3], 10) : null;
  let to = m[4] ? parseInt(m[4], 10) : from;
  if (from !== null && to < from) [from, to] = [to, from];
  if (chapter < 1 || (from !== null && from < 1)) return { error: "range" };

  return { book: found.book, chapter, from, to };
}
