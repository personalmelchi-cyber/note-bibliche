import React, { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import VerseBlock from "./VerseBlock.jsx";
import { LANGUAGES, TRANSLATIONS } from "../bible/sources.js";
import { parseReference } from "../bible/parse.js";
import { getPassage } from "../bible/providers.js";
import { loadTranslation, saveTranslation } from "../store.js";

// Esempi nella lingua della traduzione scelta.
const SUGGESTIONS = {
  it: ["Giovanni 3:16", "Salmo 23", "Filippesi 4:13", "Luca 1:76-80"],
  en: ["John 3:16", "Psalm 23", "Philippians 4:13", "Luke 1:76-80"],
  uk: ["Іван 3:16", "Псалом 23", "Филип'ян 4:13", "Лука 1:76-80"],
};
const PLACEHOLDER = { it: "Es. Giovanni 3:16 o Gv 3,16-18", en: "e.g. John 3:16 or Jn 3:16-18", uk: "напр. Іван 3:16 або Ів 3:16-18" };

const HINTS = {
  "no-chapter": "Aggiungi il capitolo e il versetto, ad esempio Giovanni 3:16.",
  unknown: "Libro non riconosciuto. Prova con il nome intero (Giovanni) o un'abbreviazione (Gv).",
  range: "Capitolo o versetto non validi.",
  ambiguous: "Abbreviazione ambigua: scrivi il nome del libro per esteso.",
};

export default function VerseSearchModal({ onInsert, onClose, closing = false }) {
  // Dissolvenza: parte trasparente, un attimo dopo compare; in uscita torna trasparente.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const visible = entered && !closing;
  const [query, setQuery] = useState("");
  const [trId, setTrId] = useState(() => {
    const saved = loadTranslation();
    return TRANSLATIONS.some((t) => t.id === saved) ? saved : TRANSLATIONS[0].id;
  });
  const [state, setState] = useState({ status: "idle" }); // idle | hint | loading | ok | notfound | network
  const [retry, setRetry] = useState(0);
  const inputRef = useRef(null);

  const tr = TRANSLATIONS.find((t) => t.id === trId);
  const lang = tr.lang;

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Ricerca automatica mentre scrivi (con piccola attesa). Se cambi testo
  // mentre una richiesta è in corso, quella vecchia viene annullata.
  useEffect(() => {
    if (!query.trim()) return setState({ status: "idle" });

    const ref = parseReference(query);
    if (!ref.book) return setState({ status: "hint", message: HINTS[ref.error] || HINTS.unknown });

    const ctrl = new AbortController();
    setState({ status: "loading" });

    const timer = setTimeout(async () => {
      try {
        const passage = await getPassage(tr, ref, ctrl.signal);
        setState({ status: "ok", passage });
      } catch (e) {
        if (e.name === "AbortError") return;
        setState({ status: e.message === "notfound" ? "notfound" : "network" });
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, trId, retry]);

  const pickTranslation = (id) => {
    setTrId(id);
    saveTranslation(id);
  };

  // Cambiando lingua si passa alla prima traduzione di quella lingua.
  const pickLanguage = (id) => {
    if (id !== lang) pickTranslation(TRANSLATIONS.find((t) => t.lang === id).id);
  };

  const submit = (e) => {
    e.preventDefault();
    if (state.status === "ok") onInsert(state.passage);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`flex flex-col w-full sm:max-w-md max-h-[88dvh] bg-bg text-fg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
          visible ? "translate-y-0 sm:scale-100 opacity-100" : "translate-y-6 sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <BookOpen size={17} className="text-muted" />
          <span className="text-[15px] font-semibold">Inserisci versetto</span>
          <button onClick={onClose} className="ml-auto p-1 text-muted" aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 pb-2">
          {/* 16px: evita lo zoom automatico di Safari su iPhone */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDER[lang]}
            enterKeyHint="go"
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-[16px] outline-none focus:border-accent"
          />

          <div className="flex gap-1 mt-3 rounded-xl bg-chip p-1" role="tablist" aria-label="Lingua">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={l.id === lang}
                onClick={() => pickLanguage(l.id)}
                className={`flex-1 rounded-lg py-1.5 text-[14px] font-medium ${
                  l.id === lang ? "bg-bg text-fg shadow-sm" : "text-muted"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-3" role="tablist" aria-label="Traduzione">
            {TRANSLATIONS.filter((t) => t.lang === lang).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === trId}
                onClick={() => pickTranslation(t.id)}
                title={t.name}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
                  t.id === trId ? "bg-accent text-black" : "bg-chip text-muted"
                }`}
              >
                {t.short}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted">{tr.name}</p>

          {!query && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTIONS[lang].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="rounded-full bg-chip px-3 py-1.5 text-[13px] text-fg active:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-[72px]">
          {state.status === "loading" && <p className="mt-3 text-[14px] text-muted">Ricerca in corso…</p>}
          {state.status === "hint" && <p className="mt-3 text-[14px] text-muted">{state.message}</p>}
          {state.status === "notfound" && (
            <p className="mt-3 text-[14px] text-muted">Questo passo non esiste in questa traduzione. Controlla capitolo e versetto.</p>
          )}
          {state.status === "network" && (
            <div className="mt-3 text-[14px] text-muted">
              Non riesco a raggiungere la Bibbia online. Controlla la connessione.
              <button onClick={() => setRetry((n) => n + 1)} className="ml-2 font-semibold text-accent">
                Riprova
              </button>
            </div>
          )}
          {state.status === "ok" && (
            <>
              <VerseBlock verse={state.passage} />
              {state.passage.truncated && (
                <p className="text-[13px] text-muted">Mostrati i primi versetti: indica un intervallo più breve per sceglierli tu.</p>
              )}
            </>
          )}
        </div>

        {state.status === "ok" && (
          <div className="p-4 pt-2 border-t border-line">
            <button
              onClick={() => onInsert(state.passage)}
              className="w-full rounded-xl bg-accent py-3 text-[16px] font-semibold text-black active:opacity-80"
            >
              Inserisci nella nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
