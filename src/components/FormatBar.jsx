import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Highlighter, Italic, List, ListOrdered, Strikethrough, X } from "lucide-react";
import { PALETTE, getRange, highlightCss, setRange } from "../richtext.js";

const inRich = () => !!document.activeElement?.closest?.("[data-rich]");

// Spazio coperto dalla tastiera del telefono: serve a tenere la barra sopra di essa.
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      // altezza della pagina "intera" meno la parte visibile sopra la tastiera
      const layoutH = document.documentElement.clientHeight || window.innerHeight;
      setInset(Math.max(0, Math.round(layoutH - vv.height - vv.offsetTop)));
    };
    // su iPhone la tastiera arriva con un'animazione: si ricontrolla finché non si ferma
    const timers = [];
    const settle = () => {
      update();
      [80, 200, 400, 700].forEach((ms) => timers.push(setTimeout(update, ms)));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    document.addEventListener("focusin", settle);
    document.addEventListener("focusout", settle);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.removeEventListener("focusin", settle);
      document.removeEventListener("focusout", settle);
      timers.forEach(clearTimeout);
    };
  }, []);
  return inset;
}

// Barra di formattazione a "nuvoletta": appare quando si scrive e resta sopra la tastiera.
export default function FormatBar() {
  const inset = useKeyboardInset();
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState({});
  const [picker, setPicker] = useState(false);
  const hideTimer = useRef(null);

  const refresh = useCallback(() => {
    clearTimeout(hideTimer.current);
    if (inRich()) {
      setVisible(true);
      const q = (c) => {
        try {
          return document.queryCommandState(c);
        } catch {
          return false;
        }
      };
      setActive({
        bold: q("bold"),
        italic: q("italic"),
        strike: q("strikeThrough"),
        ul: q("insertUnorderedList"),
        ol: q("insertOrderedList"),
      });
    } else {
      // piccolo ritardo: passando da un paragrafo all'altro la barra non deve lampeggiare
      hideTimer.current = setTimeout(() => {
        if (!inRich()) {
          setVisible(false);
          setPicker(false);
        }
      }, 120);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    document.addEventListener("focusin", refresh);
    document.addEventListener("focusout", refresh);
    return () => {
      document.removeEventListener("selectionchange", refresh);
      document.removeEventListener("focusin", refresh);
      document.removeEventListener("focusout", refresh);
      clearTimeout(hideTimer.current);
    };
  }, [refresh]);

  const run = (cmd, value) => {
    const el = document.activeElement?.closest?.("[data-rich]");
    const before = el && getRange(el);
    document.execCommand(cmd, false, value);
    // gli elenchi portano il cursore all'inizio del paragrafo: lo si rimette dov'era
    if (el && before && /List$/.test(cmd)) setRange(el, before.start, before.end);
    refresh();
  };
  const highlight = (name) => {
    // lo stile in CSS serve solo per l'evidenziatore: grassetto e corsivo restano tag semplici
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("hiliteColor", false, name ? highlightCss(name) : "transparent");
    document.execCommand("styleWithCSS", false, false);
    setPicker(false);
    refresh();
  };

  // onMouseDown: toccando un pulsante il cursore resta nel testo e la tastiera non si chiude
  const keep = (e) => e.preventDefault();
  const btn = (on) =>
    `flex size-10 items-center justify-center rounded-full transition-colors active:opacity-60 ${
      on ? "bg-accent/25 text-accent" : "text-fg"
    }`;

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 z-30 flex flex-col items-center gap-2 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ bottom: inset > 0 ? `${inset + 10}px` : "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      {/* colori dell'evidenziatore */}
      <div
        className={`glass flex items-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200 motion-reduce:transition-none ${
          visible && picker ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {Object.entries(PALETTE).map(([name, { label }]) => (
          <button
            key={name}
            tabIndex={visible && picker ? 0 : -1}
            onMouseDown={keep}
            onClick={() => highlight(name)}
            aria-label={label}
            className="size-8 rounded-full border border-black/10 active:scale-90 transition-transform"
            style={{ background: highlightCss(name) }}
          />
        ))}
        <button
          tabIndex={visible && picker ? 0 : -1}
          onMouseDown={keep}
          onClick={() => highlight(null)}
          aria-label="Togli evidenziatore"
          className="flex size-8 items-center justify-center rounded-full text-muted active:scale-90 transition-transform"
        >
          <X size={16} />
        </button>
      </div>

      {/* strumenti */}
      <div
        role="toolbar"
        aria-label="Formattazione"
        className={`glass flex items-center gap-0.5 rounded-full px-2 py-1.5 ${visible ? "pointer-events-auto" : ""}`}
      >
        <button tabIndex={visible ? 0 : -1} onMouseDown={keep} onClick={() => run("bold")} aria-label="Grassetto" aria-pressed={!!active.bold} className={btn(active.bold)}>
          <Bold size={19} />
        </button>
        <button tabIndex={visible ? 0 : -1} onMouseDown={keep} onClick={() => run("italic")} aria-label="Corsivo" aria-pressed={!!active.italic} className={btn(active.italic)}>
          <Italic size={19} />
        </button>
        <button tabIndex={visible ? 0 : -1} onMouseDown={keep} onClick={() => run("strikeThrough")} aria-label="Barrato" aria-pressed={!!active.strike} className={btn(active.strike)}>
          <Strikethrough size={19} />
        </button>
        <span className="mx-1 h-5 w-px bg-line" />
        <button tabIndex={visible ? 0 : -1} onMouseDown={keep} onClick={() => run("insertUnorderedList")} aria-label="Elenco puntato" aria-pressed={!!active.ul} className={btn(active.ul)}>
          <List size={19} />
        </button>
        <button tabIndex={visible ? 0 : -1} onMouseDown={keep} onClick={() => run("insertOrderedList")} aria-label="Elenco numerato" aria-pressed={!!active.ol} className={btn(active.ol)}>
          <ListOrdered size={19} />
        </button>
        <span className="mx-1 h-5 w-px bg-line" />
        <button tabIndex={visible ? 0 : -1} onMouseDown={keep} onClick={() => setPicker((v) => !v)} aria-label="Evidenziatore" aria-expanded={picker} className={btn(picker)}>
          <Highlighter size={19} />
        </button>
      </div>
    </div>
  );
}
