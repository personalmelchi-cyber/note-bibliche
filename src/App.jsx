import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronLeft, Plus, Search, Trash2, X } from "lucide-react";
import AutoTextarea from "./components/AutoTextarea.jsx";
import VerseBlock from "./components/VerseBlock.jsx";
import VerseSearchModal from "./components/VerseSearchModal.jsx";
import { formatDate, loadNotes, saveNotes } from "./store.js";

export default function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  // Su telefono si vede una schermata alla volta, come Note di Apple.
  const [view, setView] = useState("list");

  // Salvataggio automatico: poco dopo ogni modifica e anche quando si chiude l'app.
  const latest = useRef(notes);
  latest.current = notes;
  useEffect(() => {
    const t = setTimeout(() => saveNotes(notes), 300);
    return () => clearTimeout(t);
  }, [notes]);
  useEffect(() => {
    const flush = () => saveNotes(latest.current);
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const sorted = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes]);

  // Su schermo largo mostra sempre una nota; su telefono parte dall'elenco.
  const active = notes.find((n) => n.id === activeId) || null;
  const shown = active || (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches ? sorted[0] : null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.bodyAfter || "").toLowerCase().includes(q) ||
        n.verses.some((v) => v.human.toLowerCase().includes(q) || v.verses.some((x) => x.t.toLowerCase().includes(q)))
    );
  }, [sorted, search]);

  const update = useCallback(
    (patch) => {
      const id = shown?.id;
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
    },
    [shown?.id]
  );

  const open = (id) => {
    setActiveId(id);
    setView("editor");
  };

  const addNote = () => {
    const n = { id: Date.now(), title: "", body: "", verses: [], bodyAfter: "", updatedAt: Date.now() };
    setNotes((prev) => [n, ...prev]);
    open(n.id);
  };

  const remove = () => {
    if (!shown || !window.confirm("Eliminare questa nota?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== shown.id));
    setActiveId(null);
    setView("list");
  };

  const insertVerse = (passage) => {
    update({ verses: [...shown.verses, passage] });
    setShowModal(false);
  };

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-bg text-fg">
      {/* ELENCO */}
      <aside
        className={`${view === "editor" ? "hidden" : "flex"} sm:flex w-full sm:w-80 shrink-0 flex-col bg-panel border-r border-line`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <h1 className="px-4 pt-3 pb-1 text-[32px] font-bold sm:hidden">Note</h1>
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-xl bg-chip px-2.5 py-2">
            <Search size={16} className="text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca"
              className="flex-1 min-w-0 text-[16px] outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Cancella ricerca">
                <X size={15} className="text-muted" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="mt-10 text-center text-[15px] text-muted">{search ? "Nessuna nota trovata" : "Nessuna nota"}</p>
          )}
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n.id)}
              className={`block w-full text-left px-4 py-3 border-b border-line active:opacity-60 ${
                n.id === shown?.id ? "sm:bg-sel" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[16px] font-semibold">{n.title || "Nuova nota"}</span>
                <span className="shrink-0 text-[12px] text-muted">{formatDate(n.updatedAt)}</span>
              </div>
              <p className="truncate text-[14px] text-muted">
                {n.verses.length > 0 ? `📖 ${n.verses[0].human}` : n.body || "Nessun testo aggiuntivo"}
              </p>
            </button>
          ))}
        </div>

        <div
          className="flex items-center justify-between px-4 pt-2 border-t border-line"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
        >
          <span className="text-[13px] text-muted">
            {notes.length} {notes.length === 1 ? "nota" : "note"}
          </span>
          <button onClick={addNote} className="p-2 text-accent active:opacity-60" aria-label="Nuova nota">
            <Plus size={24} />
          </button>
        </div>
      </aside>

      {/* EDITOR */}
      <main
        className={`${view === "list" ? "hidden" : "flex"} sm:flex flex-1 min-w-0 flex-col bg-bg`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {shown ? (
          <>
            <header className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-line">
              <button
                onClick={() => setView("list")}
                className="flex items-center rounded-lg px-1 py-1 text-[17px] text-accent active:opacity-60 sm:invisible"
              >
                <ChevronLeft size={24} />
                Note
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-medium text-accent active:opacity-60"
                >
                  <BookOpen size={17} /> Versetto
                </button>
                <button onClick={remove} className="p-2 text-muted active:text-fg" aria-label="Elimina nota">
                  <Trash2 size={17} />
                </button>
              </div>
            </header>

            <div
              className="flex-1 overflow-y-auto"
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            >
              <div className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-4">
                <p className="mb-3 text-center text-[12px] text-muted">
                  {new Date(shown.updatedAt).toLocaleString("it-IT", { dateStyle: "long", timeStyle: "short" })}
                </p>
                <AutoTextarea
                  value={shown.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Titolo"
                  className="mb-2 text-[26px] font-bold leading-tight"
                />
                <AutoTextarea
                  value={shown.body}
                  onChange={(e) => update({ body: e.target.value })}
                  placeholder="Scrivi qui la tua nota…"
                  minRows={2}
                  className="text-[18px] leading-relaxed"
                />

                {shown.verses.map((v, i) => (
                  <VerseBlock
                    key={`${v.human}-${v.version}-${i}`}
                    verse={v}
                    onRemove={() => update({ verses: shown.verses.filter((_, j) => j !== i) })}
                  />
                ))}

                {shown.verses.length > 0 && (
                  <AutoTextarea
                    value={shown.bodyAfter || ""}
                    onChange={(e) => update({ bodyAfter: e.target.value })}
                    placeholder="Continua i tuoi appunti…"
                    minRows={3}
                    className="mt-1 text-[18px] leading-relaxed"
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[15px] text-muted">Seleziona o crea una nota</div>
        )}
      </main>

      {showModal && <VerseSearchModal onInsert={insertVerse} onClose={() => setShowModal(false)} />}
    </div>
  );
}
