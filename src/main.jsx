import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/400-italic.css";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import App from "./App.jsx";
import "./index.css";
import { isNative } from "./platform.js";
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
