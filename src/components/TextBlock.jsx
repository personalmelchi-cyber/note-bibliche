import React, { useEffect, useRef } from "react";
import AutoTextarea from "./AutoTextarea.jsx";

// Un paragrafo di testo della nota. Comunica sempre dove si trova il cursore,
// così "Versetto" sa in quale punto inserire il passo anche dopo che la tastiera si è chiusa.
export default function TextBlock({ block, placeholder, minRows, focusReq, onFocused, onChange, onCursor }) {
  const ref = useRef(null);

  // Richiesta dall'esterno di mettere il cursore qui (es. dopo aver inserito un versetto).
  useEffect(() => {
    const el = ref.current;
    if (!el || !focusReq || focusReq.id !== block.id) return;
    el.focus();
    el.setSelectionRange(focusReq.pos, focusReq.pos);
    el.scrollIntoView({ block: "nearest" });
    onCursor(block.id, focusReq.pos);
    onFocused();
  }, [focusReq, block.id, onCursor, onFocused]);

  const report = (e) => onCursor(block.id, e.target.selectionStart);

  return (
    <AutoTextarea
      ref={ref}
      value={block.text}
      minRows={minRows}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(block.id, e.target.value);
        report(e);
      }}
      onSelect={report}
      onKeyUp={report}
      onBlur={report}
      className="text-[18px] leading-relaxed"
    />
  );
}
