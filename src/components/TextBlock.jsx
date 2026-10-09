import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { blockHtml } from "../blocks.js";
import { cleanHtml, getOffset, htmlToText, keepCaretVisible, normalizeParagraphs, setCaret } from "../richtext.js";

// Un paragrafo di testo della nota, con formattazione (grassetto, elenchi, evidenziatore…).
// Comunica sempre dove si trova il cursore, così "Versetto" sa dove inserire il passo
// anche dopo che la tastiera si è chiusa.
export default function TextBlock({ block, placeholder, minRows = 1, focusReq, onFocused, onChange, onCursor }) {
  const ref = useRef(null);

  // Il contenuto lo scrive il browser mentre si digita; qui lo si ridisegna solo se è cambiato da fuori
  // (versetto inserito, versetto tolto…), così il cursore non salta.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const want = cleanHtml(blockHtml(block));
    if (cleanHtml(el.innerHTML) !== want) el.innerHTML = want;
  }, [block]);

  const report = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = getOffset(el);
    if (pos !== null) onCursor(block.id, pos);
  }, [block.id, onCursor]);

  useEffect(() => {
    document.addEventListener("selectionchange", report);
    return () => document.removeEventListener("selectionchange", report);
  }, [report]);

  // Richiesta dall'esterno di mettere il cursore qui (es. dopo aver inserito un versetto).
  useEffect(() => {
    const el = ref.current;
    if (!el || !focusReq || focusReq.id !== block.id) return;
    el.focus({ preventScroll: true });
    setCaret(el, focusReq.pos);
    el.scrollIntoView({ block: "nearest" });
    onCursor(block.id, focusReq.pos);
    onFocused();
  }, [focusReq, block.id, onCursor, onFocused]);

  const onInput = () => {
    const el = ref.current;
    normalizeParagraphs(el);
    const html = cleanHtml(el.innerHTML);
    onChange(block.id, { html, text: htmlToText(html) });
    report();
    requestAnimationFrame(keepCaretVisible); // la riga nuova non deve finire sotto la barra
  };

  const onKeyDown = (e) => {
    // Invio = nuovo paragrafo (dentro un elenco ci pensa il browser). Maiusc+Invio = solo andare a capo.
    if (e.key === "Enter" && e.shiftKey && !e.nativeEvent.isComposing) {
      const inList = window.getSelection()?.anchorNode?.parentElement?.closest("li");
      if (!inList) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
      }
    }
  };

  // Incollando si tiene solo il testo: niente stili strani da altre app. Ogni riga diventa un paragrafo.
  const onPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    text.split("\n").forEach((line, i) => {
      if (i) document.execCommand("insertParagraph");
      if (line) document.execCommand("insertText", false, line);
    });
  };

  return (
    <div
      ref={ref}
      data-rich
      data-empty={!block.text}
      data-placeholder={placeholder || ""}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      className="rich text-[16px] leading-[1.4]"
      style={{ minHeight: `${minRows * 1.4}em` }}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onKeyUp={() => {
        report();
        keepCaretVisible();
      }}
      onMouseUp={report}
      onTouchEnd={() => {
        report();
        setTimeout(keepCaretVisible, 350); // dopo che la tastiera è salita
      }}
      onFocus={() => {
        document.execCommand("defaultParagraphSeparator", false, "p");
        report();
        setTimeout(keepCaretVisible, 350);
      }}
    />
  );
}
