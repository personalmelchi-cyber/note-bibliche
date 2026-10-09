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

const SB_KEY = "note-bibliche-sidebar";
export const loadSidebar = () => {
  try {
    return localStorage.getItem(SB_KEY) !== "closed";
  } catch {
    return true;
  }
};
export const saveSidebar = (open) => {
  try {
    localStorage.setItem(SB_KEY, open ? "open" : "closed");
  } catch {
    /* ignora */
  }
};

const DAY = 86400000;
/** Ora di oggi, giorno della settimana negli ultimi 7 giorni, altrimenti la data breve. */
export function rowTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / DAY);
  if (diff === 0) return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (diff > 0 && diff < 7) {
    const w = d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }).replace(".", "");
}
/** "Questa settimana" = ultimi 7 giorni, il resto "Più vecchie". */
export const isThisWeek = (ts) => Date.now() - ts < 7 * DAY;
