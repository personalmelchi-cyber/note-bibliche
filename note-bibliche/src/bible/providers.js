import { SOURCES } from "./sources.js";
import { displayName } from "./books.js";

// Cache in memoria: lo stesso capitolo non viene scaricato due volte.
const chapterCache = new Map();

async function viaProxy(tr, book, chapter, signal) {
  // Funzione serverless di Vercel: nessun problema di CORS, risposte in cache.
  const qs = new URLSearchParams({ p: tr.provider, k: tr.key, b: String(book), c: String(chapter) });
  const res = await fetch(`/api/bible?${qs}`, { signal });
  if (res.status === 404) throw new Error("notfound");
  if (!res.ok) throw new Error("proxy");
  const json = await res.json(); // in locale (vite dev) /api non esiste: qui lancia e si passa al diretto
  if (!Array.isArray(json?.verses)) throw new Error("proxy");
  return json.verses;
}

async function direct(tr, book, chapter, signal) {
  const src = SOURCES[tr.provider];
  const res = await fetch(src.url(tr.key, book, chapter), { signal });
  if (res.status === 404) throw new Error("notfound");
  if (!res.ok) throw new Error("network");
  return src.parse(await res.json());
}

async function fetchChapter(tr, book, chapter, signal) {
  const key = `${tr.id}/${book}/${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);

  let verses;
  try {
    verses = await viaProxy(tr, book, chapter, signal);
  } catch (e) {
    if (e.name === "AbortError" || e.message === "notfound") throw e;
    try {
      verses = await direct(tr, book, chapter, signal);
    } catch (e2) {
      if (e2.name === "AbortError" || e2.message === "notfound") throw e2;
      throw new Error("network");
    }
  }
  if (!verses.length) throw new Error("notfound");
  chapterCache.set(key, verses);
  return verses;
}

const MAX_VERSES = 60;

/** Scarica il passo richiesto. Ritorna { human, version, verses, truncated }. */
export async function getPassage(tr, ref, signal) {
  const all = await fetchChapter(tr, ref.book.n, ref.chapter, signal);

  const whole = ref.from === null;
  let picked = whole ? all : all.filter((v) => v.n >= ref.from && v.n <= ref.to);
  if (!picked.length) throw new Error("notfound");

  let truncated = false;
  if (picked.length > MAX_VERSES) {
    picked = picked.slice(0, MAX_VERSES);
    truncated = true;
  }

  const name = displayName(ref.book, tr.lang);
  let human = `${name} ${ref.chapter}`;
  if (!whole || truncated) {
    const a = picked[0].n;
    const b = picked[picked.length - 1].n;
    human += a === b ? `:${a}` : `:${a}-${b}`;
  }

  return { human, version: tr.short, verses: picked, truncated };
}
