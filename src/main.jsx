import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/400-italic.css";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard } from "@capacitor/keyboard";
import App from "./App.jsx";
import "./index.css";
import { getKeyboardHeight, isNative, setKeyboardHeight } from "./platform.js";
import { keepCaretVisible } from "./richtext.js";
import { restoreFromNative } from "./backup.js";

function render() {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (isNative) {
  // Nell'app installata recupera prima le note dalla memoria nativa, poi apre
  // l'interfaccia. Qualunque cosa succeda, l'interfaccia viene comunque mostrata.
  restoreFromNative()
    .catch(() => {})
    .finally(() => {
      render();
      setupNative();
    });
} else {
  render();
  // Offline nel browser: registra il service worker solo nella versione pubblicata.
  // Nell'app installata non serve: i file sono già sul telefono.
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
}

function setupNative() {
  // Tastiera (solo iPhone):
  // - niente barra "∧ ∨ ✓" sopra la tastiera, tipica dei moduli web
  // - la pagina intera non scorre: si accorcia sopra la tastiera (resize "body"
  //   in capacitor.config.json: niente angoli neri), così l'intestazione con «Versetto» resta in vista
  //   e scorre solo il testo della nota.
  try {
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
    Keyboard.setScroll({ isDisabled: true }).catch(() => {});
    // Appena la tastiera sale, la riga del cursore viene portata sopra la tastiera
    // e sopra la barra di formattazione, senza aspettare che si inizi a scrivere.
    const reveal = () => [0, 60, 180].forEach((ms) => setTimeout(keepCaretVisible, ms));
    Keyboard.addListener("keyboardWillShow", (info) => setKeyboardHeight(info?.keyboardHeight));
    Keyboard.addListener("keyboardDidShow", (info) => {
      setKeyboardHeight(info?.keyboardHeight);
      reveal();
    });
    Keyboard.addListener("keyboardWillHide", () => setKeyboardHeight(0));
    // a tastiera chiusa la pagina torna sempre a tutta altezza (anche se è stata
    // chiusa trascinando), così la nota si può scorrere su tutto lo schermo
    Keyboard.addListener("keyboardDidHide", () => {
      document.body.style.height = "";
      setKeyboardHeight(0);
      window.scrollTo(0, 0);
    });
  } catch {
    /* non su iOS: ignora */
  }
  // Come in Note di Apple: scorrendo la nota, se il dito scende fino alla tastiera
  // (o alla barra di formattazione appena sopra), la tastiera si chiude.
  let drag = null;
  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      drag = t && e.target.closest?.("[data-scroll]") ? { y: t.clientY } : null;
    },
    { passive: true }
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (!drag || !t) return;
      const kb = Math.max(getKeyboardHeight(), window.innerHeight - document.body.getBoundingClientRect().height);
      if (kb < 80) return; // tastiera chiusa
      const keyboardTop = window.innerHeight - kb;
      const movingDown = t.clientY - drag.y > 24;
      if (movingDown && t.clientY > keyboardTop - 70) {
        drag = null;
        document.activeElement?.blur?.();
        Keyboard.hide().catch(() => {});
      }
    },
    { passive: true }
  );
  document.addEventListener("touchend", () => (drag = null), { passive: true });

  // Rete di sicurezza: se iOS sposta comunque la pagina, la rimette in cima.
  const pin = () => {
    if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
  };
  window.addEventListener("scroll", pin, { passive: true });
  window.visualViewport?.addEventListener("resize", pin);
  window.visualViewport?.addEventListener("scroll", pin);

  try {
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const applyBar = () =>
      StatusBar.setStyle({ style: dark.matches ? Style.Dark : Style.Light }).catch(() => {});
    applyBar();
    dark.addEventListener("change", applyBar);
  } catch {
    /* barra di stato: non essenziale */
  }
  try {
    SplashScreen.hide().catch(() => {});
  } catch {
    /* ignora */
  }
}
