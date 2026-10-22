import { Capacitor } from "@capacitor/core";

// true dentro l'app per iPhone/Android (Capacitor), false nel browser.
export const isNative = Capacitor.isNativePlatform();

// Indirizzo della funzione /api/bible.
// Nel browser è lo stesso sito; nell'app installata la pagina gira in locale,
// quindi serve l'indirizzo completo della versione pubblicata su Vercel.
export const API_BASE = isNative
  ? import.meta.env.VITE_API_BASE || "https://note-bibliche.vercel.app"
  : "";

// Altezza della tastiera nell'app installata, comunicata dal plugin Keyboard.
// Nel browser resta 0 e si usa visualViewport.
let keyboardHeight = 0;
export const getKeyboardHeight = () => keyboardHeight;
export function setKeyboardHeight(h) {
  keyboardHeight = Math.max(0, Math.round(h || 0));
  window.dispatchEvent(new CustomEvent("scribae:keyboard", { detail: keyboardHeight }));
}
