// Funzione serverless (Vercel): /api/bible?p=bolls&k=NR06&b=43&c=3
// Fa da ponte verso le Bibbie online: niente problemi di CORS e risposte
// tenute in cache dalla rete di Vercel (i testi biblici non cambiano).
//
// Sicurezza: accetta solo traduzioni dell'elenco e numeri interi, quindi
// non può essere usata per raggiungere indirizzi arbitrari.
import { SOURCES, TRANSLATIONS } from "../src/bible/sources.js";

export default async function handler(req, res) {
  const { p, k, b, c } = req.query;

  const tr = TRANSLATIONS.find((t) => t.provider === p && t.key === k);
  const book = Number(b);
  const chapter = Number(c);
  if (!tr || !Number.isInteger(book) || book < 1 || book > 66 || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return res.status(400).json({ error: "bad-request" });
  }

  try {
    const src = SOURCES[tr.provider];
    const upstream = await fetch(src.url(tr.key, book, chapter), { headers: { accept: "application/json" } });
    if (upstream.status === 404) return res.status(404).json({ error: "notfound" });
    if (!upstream.ok) return res.status(502).json({ error: "upstream" });

    const verses = src.parse(await upstream.json());
    if (!verses.length) return res.status(404).json({ error: "notfound" });

    res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=31536000");
    return res.status(200).json({ verses });
  } catch {
    return res.status(502).json({ error: "upstream" });
  }
}
