import { migrateNote, textBlock } from "./blocks.js";

const KEY = "note-bibliche-v1";
const TR_KEY = "note-bibliche-translation";

const seed = () => [
  {
    id: Date.now(),
    title: "Benvenuto",
    blocks: [
      textBlock(
        "Scrivi i tuoi appunti qui. Metti il cursore dove vuoi e tocca «Versetto» per inserire un passo biblico: il testo prima del cursore resta sopra, quello dopo scende sotto il versetto. Prova con Giovanni 3:16 oppure Luca 1:76-80."
      ),
    ],
    updatedAt: Date.now(),
  },
];

export function loadNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(parsed) && parsed.length) return parsed.map(migrateNote);
    if (Array.isArray(parsed)) return parsed; // elenco vuoto: l'utente ha eliminato tutto
  } catch {
    /* dati illeggibili: si riparte da zero */
  }
  return seed();
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* memoria piena o navigazione privata */
  }
}

export const loadTranslation = () => {
  try {
    return localStorage.getItem(TR_KEY);
  } catch {
    return null;
  }
};
export const saveTranslation = (id) => {
  try {
    localStorage.setItem(TR_KEY, id);
  } catch {
    /* ignora */
  }
};

export function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(today) - day(d)) / 86400000);
  if (diff === 0) return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Ieri";
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}
