import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/400-italic.css";
import App from "./App.jsx";
import "./index.css";
import { isNative } from "./platform.js";
import { restoreFromNative } from "./backup.js";

// Nell'app installata recupera prima le note dalla memoria nativa, poi apre l'interfaccia.
restoreFromNative().then(() =>
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);

if (isNative) {
  setupNative();
} else if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // Offline nel browser: registra il service worker solo nella versione pubblicata.
  // Nell'app installata non serve: i file sono già sul telefono.
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

async function setupNative() {
  const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
  ]);
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const applyBar = () =>
    StatusBar.setStyle({ style: dark.matches ? Style.Dark : Style.Light }).catch(() => {});
  applyBar();
  dark.addEventListener("change", applyBar);
  SplashScreen.hide().catch(() => {});
}
