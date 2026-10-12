// Nell'app installata le note stanno anche nella memoria nativa del telefono
// (Preferences), non solo nel localStorage della WebView: iOS può svuotare
// i dati web quando lo spazio scarseggia, la memoria nativa no.
import { isNative } from "./platform.js";

const KEYS = ["note-bibliche-v1", "note-bibliche-translation", "note-bibliche-sidebar"];

let prefs = null;
async function getPrefs() {
  if (!prefs) prefs = (await import("@capacitor/preferences")).Preferences;
  return prefs;
}

/** Prima di aprire l'app: se il localStorage è vuoto, lo riempie dalla copia nativa. */
export async function restoreFromNative() {
  if (!isNative) return;
  try {
    const P = await getPrefs();
    for (const key of KEYS) {
      if (localStorage.getItem(key) !== null) continue;
      const { value } = await P.get({ key });
      if (value !== null) localStorage.setItem(key, value);
    }
  } catch {
    /* si parte con quello che c'è */
  }
}

/** Copia un valore anche nella memoria nativa (senza attendere). */
export function mirror(key, value) {
  if (!isNative) return;
  getPrefs()
    .then((P) => P.set({ key, value }))
    .catch(() => {});
}
