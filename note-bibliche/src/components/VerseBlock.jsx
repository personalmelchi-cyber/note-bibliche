import React from "react";
import { X } from "lucide-react";

// Stile preso dallo screenshot: barra verticale a sinistra, testo serif grande,
// numeri di versetto piccoli e grigi in apice, riferimento in grassetto sotto.
function VerseBlock({ verse, onRemove }) {
  return (
    <figure className="relative my-4 pl-4 pr-7 border-l-[5px] border-bar rounded-[2px] m-0">
      <blockquote className="m-0 font-serif text-[20px] leading-[1.75] text-fg">
        {verse.verses.map((v) => (
          <span key={v.n}>
            <sup className="font-sans text-[12px] text-muted mr-[2px] align-baseline relative -top-[0.55em]">{v.n}</sup>
            {v.t}{" "}
          </span>
        ))}
      </blockquote>
      <figcaption className="mt-1.5 text-[15px] font-bold text-fg">
        {verse.human} {verse.version}
      </figcaption>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute right-0 top-0 p-2 text-muted active:text-fg"
          aria-label="Rimuovi versetto"
        >
          <X size={16} />
        </button>
      )}
    </figure>
  );
}

export default React.memo(VerseBlock);
