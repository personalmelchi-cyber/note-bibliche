import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, PanelLeftClose, PanelLeftOpen, Plus, Search, Trash2, X } from "lucide-react";
import AutoTextarea from "./components/AutoTextarea.jsx";
import TextBlock from "./components/TextBlock.jsx";
import Logo from "./components/Logo.jsx";
import FormatBar from "./components/FormatBar.jsx";
import VerseBlock from "./components/VerseBlock.jsx";
import VerseSearchModal from "./components/VerseSearchModal.jsx";
import { insertVerse, noteSearchText, notePreview, removeBlock, textBlock } from "./blocks.js";
import { splitBlock } from "./richtext.js";
import { isThisWeek, loadNotes, loadSidebar, rowTime, saveNotes, saveSidebar } from "./store.js";

export default function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false); // il popup è nella pagina
  const [modalClosing, setModalClosing] = useState(false); // sta sfumando in uscita
  const closeTimer = useRef(null);
  const openModal = () => {
    clearTimeout(closeTimer.current);
    setModalClosing(false);
    setShowModal(true);
  };
  const closeModal = useCallback(() => {
    setModalClosing(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);
    }, 220);
  }, []);
  const [newId, setNewId] = useState(null); // nota appena creata: il cursore parte dal titolo
  // Su telefono si vede una schermata alla volta, come Note di Apple.
  const [view, setView] = useState("list");
  // Su schermo largo l'elenco a sinistra si può chiudere; la scelta resta salvata.
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebar);
  const toggleSidebar = () =>
    setSidebarOpen((v) => {
      saveSidebar(!v);
      return !v;
    });

  // Dove si trova il cursore (blocco di testo + posizione). Serve a "Versetto"
  // per inserire il passo nel punto giusto. È un ref: cambia a ogni tocco senza rifare il disegno.
  const cursor = useRef({ id: null, pos: 0 });
  const onCursor = useCallback((id, pos) => {
    cursor.current = { id, pos };
  }, []);
  // Richiesta di mettere il cursore in un punto (dopo l'inserimento, sotto il versetto).
  const [focusReq, setFocusReq] = useState(null);
  const onFocused = useCallback(() => setFocusReq(null), []);

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
    return q ? sorted.filter((n) => noteSearchText(n).includes(q)) : sorted;
  }, [sorted, search]);

  // l'elenco è diviso in "Questa settimana" e "Più vecchie"
  const groups = useMemo(
    () =>
      [
        { label: "Questa settimana", items: filtered.filter((n) => isThisWeek(n.updatedAt)) },
        { label: "Più vecchie", items: filtered.filter((n) => !isThisWeek(n.updatedAt)) },
      ].filter((g) => g.items.length),
    [filtered]
  );

  const update = useCallback(
    (patch) => {
      const id = shown?.id;
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
    },
    [shown?.id]
  );

  const editText = useCallback(
    (blockId, patch) => {
      const id = shown?.id;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)), updatedAt: Date.now() }
            : n
        )
      );
    },
    [shown?.id]
  );

  // Evidenziatore sui versetti: si salva l'HTML con le evidenziazioni dentro il versetto.
  const editVerse = useCallback(
    (blockId, patch) => {
      const id = shown?.id;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, verse: { ...b.verse, ...patch } } : b)), updatedAt: Date.now() }
            : n
        )
      );
    },
    [shown?.id]
  );

  const open = (id) => {
    setActiveId(id);
    setView("editor");
  };

  const addNote = () => {
    const n = { id: Date.now(), title: "", blocks: [textBlock()], updatedAt: Date.now() };
    setNotes((prev) => [n, ...prev]);
    setNewId(n.id);
    open(n.id);
  };

  const remove = () => {
    if (!shown || !window.confirm("Eliminare questa nota?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== shown.id));
    setActiveId(null);
    setView("list");
  };

  const addVerse = (passage) => {
    const { blocks, focus } = insertVerse(shown.blocks, cursor.current, passage, splitBlock);
    update({ blocks });
    setFocusReq(focus);
    closeModal();
  };

  const lastIndex = shown ? shown.blocks.length - 1 : 0;

  return (
    <div className="relative h-[100dvh] w-full flex overflow-hidden bg-bg text-fg">
      <div className="ambient pointer-events-none absolute inset-0" />
      {/* ELENCO */}
      <aside
        className={`${view === "editor" ? "hidden" : "flex"} sm:flex relative z-10 w-full shrink-0 flex-col glass max-sm:border-0 max-sm:shadow-none sm:rounded-3xl sm:overflow-hidden sm:transition-[width,margin,opacity,visibility] sm:duration-300 sm:ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
          sidebarOpen ? "sm:w-80 sm:m-3 sm:opacity-100 sm:visible" : "sm:w-0 sm:m-0 sm:border-0 sm:opacity-0 sm:invisible sm:pointer-events-none"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        aria-hidden={!sidebarOpen}
      >
        {/* larghezza fissa su desktop: mentre il pannello si chiude il contenuto non si schiaccia */}
        <div className="flex min-h-0 flex-1 flex-col sm:w-80 sm:shrink-0">
        <div className="flex items-center gap-2.5 px-5 pt-4">
          <Logo size={32} />
          <span className="text-[22px] font-bold tracking-tight">scribae</span>
          <button
            onClick={toggleSidebar}
            className="ml-auto hidden sm:block shrink-0 p-2 text-muted active:opacity-60"
            aria-label="Chiudi elenco note"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
        <h1 className="px-5 pt-3 pb-3 text-[40px] font-extrabold leading-none tracking-tight">Note</h1>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl bg-chip px-3 py-2.5">
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

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 && (
            <p className="mt-10 text-center text-[15px] text-muted">{search ? "Nessuna nota trovata" : "Nessuna nota"}</p>
          )}
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="px-2 pt-4 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{g.label}</h2>
              <div className="overflow-hidden rounded-2xl bg-panel/80">
                {g.items.map((n, i) => (
                  <button
                    key={n.id}
                    onClick={() => open(n.id)}
                    className={`block w-full px-4 py-3 text-left active:opacity-60 ${i ? "border-t border-line" : ""} ${
                      n.id === shown?.id ? "sm:bg-sel" : ""
                    }`}
                  >
                    <span className="block truncate text-[16.5px] font-bold">{n.title || "Nuova nota"}</span>
                    <span className="mt-0.5 flex gap-2 text-[14px] text-muted">
                      <span className="shrink-0">{rowTime(n.updatedAt)}</span>
                      <span className="truncate">{notePreview(n) || "Nessun testo aggiuntivo"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div
          className="relative flex shrink-0 items-center justify-center border-t border-line px-4 pt-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))", minHeight: "4.5rem" }}
        >
          <span className="text-[13px] text-muted">
            {notes.length} {notes.length === 1 ? "nota" : "note"}
          </span>
          <button
            onClick={addNote}
            className="absolute right-4 top-1/2 flex size-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-black/15 active:scale-95 transition-transform"
            style={{ marginTop: "calc(-1 * env(safe-area-inset-bottom) / 2)" }}
            aria-label="Nuova nota"
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </div>
              </div>
      </aside>

      {/* EDITOR */}
      <main
        className={`${view === "list" ? "hidden" : "flex"} sm:flex relative flex-1 min-w-0 flex-col bg-bg sm:bg-transparent`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {shown ? (
          <>
            <header className="flex items-center justify-between px-2 sm:px-4 py-2.5 border-b border-line">
              <button
                onClick={() => setView("list")}
                className="flex items-center rounded-lg px-1 py-1 text-[17px] text-accent-ink active:opacity-60 sm:hidden"
              >
                <ChevronLeft size={24} />
                Note
              </button>
              {sidebarOpen ? (
                <span className="hidden sm:block" />
              ) : (
                <div className="hidden sm:flex items-center">
                  <button onClick={toggleSidebar} className="p-2 text-accent active:opacity-60" aria-label="Apri elenco note">
                    <PanelLeftOpen size={20} />
                  </button>
                  <button onClick={addNote} className="p-2 text-accent active:opacity-60" aria-label="Nuova nota">
                    <Plus size={22} />
                  </button>
                </div>
              )}
              <div className="flex items-center">
                {/* onMouseDown: non togliere il cursore dal testo quando si tocca il pulsante */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openModal}
                  className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3.5 py-2 text-[15px] font-semibold text-accent-ink active:opacity-60"
                >
                  <Bookmark size={17} fill="currentColor" /> Versetto
                </button>
                <button onClick={remove} className="ml-1 p-2.5 text-muted active:text-fg" aria-label="Elimina nota">
                  <Trash2 size={19} />
                </button>
              </div>
            </header>

            <div
              data-scroll
              className="flex-1 overflow-y-auto"
              style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom) + var(--kb, 0px))" }}
            >
              <div className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-4">
                <p className="mb-3 text-center text-[13px] text-muted">
                  {new Date(shown.updatedAt).toLocaleDateString("it-IT", { dateStyle: "long" })} ·{" "}
                  {new Date(shown.updatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <AutoTextarea
                  key={shown.id}
                  autoFocus={shown.id === newId}
                  value={shown.title}
                  onChange={(e) => update({ title: e.target.value })}
                  onKeyDown={(e) => {
                    // Invio nel titolo: si passa a scrivere il testo
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setFocusReq({ id: shown.blocks[0].id, pos: 0 });
                    }
                  }}
                  placeholder="Titolo"
                  className="mb-3 text-[30px] font-extrabold leading-tight tracking-tight"
                />

                {shown.blocks.map((b, i) =>
                  b.type === "verse" ? (
                    <VerseBlock key={b.id} id={b.id} verse={b.verse} onColor={(bg) => editVerse(b.id, { bg })} onRemove={() => update({ blocks: removeBlock(shown.blocks, b.id) })} />
                  ) : (
                    <TextBlock
                      key={b.id}
                      block={b}
                      // l'ultimo paragrafo è più alto: così c'è sempre spazio dove toccare per continuare a scrivere
                      minRows={i === lastIndex && lastIndex > 0 ? 3 : 1}
                      placeholder={shown.blocks.length === 1 ? "Scrivi qui la tua nota…" : i === lastIndex ? "Continua i tuoi appunti…" : ""}
                      focusReq={focusReq}
                      onFocused={onFocused}
                      onChange={editText}
                      onCursor={onCursor}
                    />
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="relative flex flex-1 items-center justify-center text-[15px] text-muted">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3 top-3 hidden sm:block p-2 text-accent active:opacity-60"
                aria-label="Apri elenco note"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
            Seleziona o crea una nota
          </div>
        )}
      </main>

      {shown && <FormatBar onVerseChange={(id, html) => editVerse(id, { html })} />}
      {showModal && <VerseSearchModal onInsert={addVerse} onClose={closeModal} closing={modalClosing} />}
    </div>
  );
}
