import React, { useEffect, useRef, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { verseHtml, verseLabel } from "../blocks.js";

// Colori di sfondo del versetto (le tinte sono nel CSS, una per tema chiaro e scuro).
export const VERSE_COLORS = [
  { key: "orange", label: "Arancione" },
  { key: "ocra", label: "Giallo ocra" },
  { key: "olive", label: "Verde oliva" },
  { key: "beige", label: "Beige" },
  { key: "gray", label: "Grigio chiaro" },
];

// Scheda del versetto: sfondo colorato, riferimento in alto, testo corsivo con numeri in apice.
// Il testo si può evidenziare (non modificare). Il segnalibro in alto a destra cambia lo sfondo.
function VerseBlock({ id, verse, onRemove, onColor }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const bg = VERSE_COLORS.some((c) => c.key === verse.bg) ? verse.bg : "beige";

  // si chiude toccando fuori
  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  return (
    <figure
      data-verse-id={id}
      className="relative my-3 m-0 rounded-2xl px-4 py-3.5 transition-colors duration-300"
      style={{ background: `var(--vbg-${bg})` }}
    >
      <figcaption className="pr-9 text-[12px] font-bold uppercase tracking-[0.06em] text-accent-ink">
        {verseLabel(verse)} · {verse.version}
      </figcaption>
      <blockquote
        data-verse-text
        className="verse-text m-0 mt-1 font-serif text-[17px] italic leading-[1.5] text-fg"
        dangerouslySetInnerHTML={{ __html: verseHtml(verse) }}
      />

      {onColor && (
        <div ref={box} className="absolute right-1.5 top-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-accent active:opacity-60"
            aria-label="Colore del versetto"
            aria-expanded={open}
          >
            <Bookmark size={20} fill="currentColor" />
          </button>
          <div
            className={`glass glass-strong absolute right-0 top-10 z-20 flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-200 motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
            }`}
          >
            {VERSE_COLORS.map((c) => (
              <button
                key={c.key}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  onColor(c.key);
                  setOpen(false);
                }}
                aria-label={c.label}
                aria-pressed={bg === c.key}
                className={`size-7 shrink-0 rounded-full border border-black/10 transition-transform active:scale-90 ${
                  bg === c.key ? "ring-2 ring-accent ring-offset-1 ring-offset-transparent" : ""
                }`}
                style={{ background: `var(--vbg-${c.key})` }}
              />
            ))}
            {onRemove && (
              <>
                <span className="mx-0.5 h-5 w-px bg-line" />
                <button
                  tabIndex={open ? 0 : -1}
                  onClick={onRemove}
                  className="shrink-0 p-1 text-muted active:text-fg"
                  aria-label="Rimuovi versetto"
                >
                  <Trash2 size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </figure>
  );
}

export default React.memo(VerseBlock);
