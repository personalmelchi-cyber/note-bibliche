import { LANGUAGES as ALL_LANGUAGES, TRANSLATIONS as ALL_TRANSLATIONS } from "./sources.js";
import { isNative } from "../platform.js";

// Traduzioni offerte nell'app pubblicata su App Store e Google Play.
// Solo testi di pubblico dominio: le altre (NR06, NIV, ESV, ...) hanno diritti
// d'autore e un'app pubblica non può distribuirle senza licenza.
// Ottenuta una licenza, basta aggiungere qui il suo id.
// Nel browser (versione Vercel) restano disponibili tutte.
export const STORE_TRANSLATIONS = ["DIODATI", "KJV", "WEB", "UBIO", "UKRK"];

// VITE_STORE_ONLY=1 mostra l'elenco ridotto anche nel browser (per le schermate degli store).
const storeOnly = isNative || import.meta.env.VITE_STORE_ONLY === "1";

export const TRANSLATIONS = storeOnly
  ? ALL_TRANSLATIONS.filter((t) => STORE_TRANSLATIONS.includes(t.id))
  : ALL_TRANSLATIONS;

export const LANGUAGES = ALL_LANGUAGES.filter((l) => TRANSLATIONS.some((t) => t.lang === l.id));
