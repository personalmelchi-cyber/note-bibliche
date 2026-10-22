// Nell'app installata le note stanno anche nella memoria nativa del telefono
// (Preferences), non solo nel localStorage della WebView: iOS può svuotare
// i dati web quando lo spazio scarseggia, la memoria nativa no.
//
// Attenzione: un plugin di Capacitor non va mai restituito da una funzione async
// o da una Promise (es. `return (await import(...)).Preferences`): JavaScript
// chiederebbe al plugin un metodo .then() che non esiste e l'app si bloccherebbe
// con lo schermo bianco. Per questo l'import è statico.
import { Preferences } from "@capacitor/preferences";
import { isNative } from "./platform.js";

const KEYS = ["note-bibliche-v1", "note-bibliche-translation", "note-bibliche-sidebar"];

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

/** Prima di aprire l'app: se il localStorage è vuoto, lo riempie dalla copia nativa. */
export async function restoreFromNative() {
  if (!isNative) return;
  try {
    await withTimeout(
      (async () => {
        for (const key of KEYS) {
          if (localStorage.getItem(key) !== null) continue;
          const { value } = await Preferences.get({ key });
          if (value !== null && value !== undefined) localStorage.setItem(key, value);
        }
      })(),
      1500
    );
  } catch {
    /* si parte con quello che c'è */
  }
}

/** Copia un valore anche nella memoria nativa (senza attendere). */
export function mirror(key, value) {
  if (!isNative) return;
  try {
    Preferences.set({ key, value }).catch(() => {});
  } catch {
    /* ignora */
  }
}
