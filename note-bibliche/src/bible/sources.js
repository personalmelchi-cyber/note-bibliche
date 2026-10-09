// Fonti bibliche online gratuite, senza chiave API.
// Questo file è usato sia dal browser sia dalla funzione serverless /api/bible.
//
// Per aggiungere una traduzione basta una riga in TRANSLATIONS.
// Per aggiungere un servizio nuovo (es. un'altra API) basta una voce in SOURCES.

export const LANGUAGES = [
  { id: "it", label: "Italiano" },
  { id: "en", label: "English" },
  { id: "uk", label: "Українська" },
];

// `short` è la sigla mostrata sotto il versetto. `key` è il codice usato dal servizio.
// Le prime di ogni lingua sono quelle proposte per prime.
export const TRANSLATIONS = [
  // --- Italiano
  { id: "NR06", lang: "it", short: "NR06", name: "Nuova Riveduta 2006", provider: "bolls", key: "NR06" },
  { id: "DIODATI", lang: "it", short: "Diodati", name: "Giovanni Diodati 1649", provider: "getbible", key: "giovanni" },

  // --- English (Bolls)
  { id: "KJV", lang: "en", short: "KJV", name: "King James Version", provider: "bolls", key: "KJV" },
  { id: "WEB", lang: "en", short: "WEB", name: "World English Bible", provider: "bolls", key: "WEB" },
  { id: "NKJV", lang: "en", short: "NKJV", name: "New King James Version", provider: "bolls", key: "NKJV" },
  { id: "ESV", lang: "en", short: "ESV", name: "English Standard Version", provider: "bolls", key: "ESV" },
  { id: "NIV", lang: "en", short: "NIV", name: "New International Version 2011", provider: "bolls", key: "NIV2011" },
  { id: "NASB", lang: "en", short: "NASB", name: "New American Standard Bible 1995", provider: "bolls", key: "NASB" },
  { id: "NLT", lang: "en", short: "NLT", name: "New Living Translation", provider: "bolls", key: "NLT" },

  // --- Українська (Bolls)
  { id: "UBIO", lang: "uk", short: "Огієнко", name: "Біблія, Іван Огієнко 1962", provider: "bolls", key: "UBIO" },
  { id: "UKRK", lang: "uk", short: "Куліш", name: "Біблія, Куліш, Нечуй-Левицький, Пулюй 1903", provider: "bolls", key: "UKRK" },
  { id: "HOM", lang: "uk", short: "Хоменко", name: "Святе Письмо, Іван Хоменко 1963", provider: "bolls", key: "HOM" },
  { id: "PHIL", lang: "uk", short: "Філарет", name: "Переклад Патріарха Філарета 2004", provider: "bolls", key: "PHIL" },
  { id: "CUV23", lang: "uk", short: "УБТ 2020", name: "Сучасний переклад УБТ 2020-2023", provider: "bolls", key: "CUV23" },
  { id: "GYZ", lang: "uk", short: "Гижа", name: "Переклад Олександра Гижі 2019", provider: "bolls", key: "GYZ" },
];

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" };

/** Toglie l'HTML (note, numeri di Strong, <br>) e lascia solo il testo del versetto. */
export function clean(html) {
  return String(html ?? "")
    .replace(/<S>\s*[GHgh]?\d+\s*<\/S>/g, "")
    .replace(/<sup>.*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|quot|apos|lt|gt|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?»])/g, "$1")
    .trim();
}

// Ogni servizio sa costruire l'indirizzo di un capitolo e leggerne la risposta.
// `book` è il numero 1-66 (Genesi = 1, Giovanni = 43, Apocalisse = 66).
export const SOURCES = {
  bolls: {
    url: (key, book, chapter) => `https://bolls.life/get-text/${key}/${book}/${chapter}/`,
    parse: (json) => (Array.isArray(json) ? json.map((v) => ({ n: v.verse, t: clean(v.text) })) : []),
  },
  getbible: {
    url: (key, book, chapter) => `https://api.getbible.net/v2/${key}/${book}/${chapter}.json`,
    parse: (json) => (Array.isArray(json?.verses) ? json.verses.map((v) => ({ n: v.verse, t: clean(v.text) })) : []),
  },
};
