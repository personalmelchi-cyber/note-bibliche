const KEY = "note-bibliche-v1";
const TR_KEY = "note-bibliche-translation";

const seed = () => [
  {
    id: Date.now(),
    title: "Benvenuto",
    body: "Scrivi i tuoi appunti qui. Tocca «Versetto» in alto per inserire un passo biblico, ad esempio Giovanni 3:16 oppure Luca 1:76-80.",
    verses: [],
    bodyAfter: "",
    updatedAt: Date.now(),
  },
];

export function loadNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(parsed)) return parsed;
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
