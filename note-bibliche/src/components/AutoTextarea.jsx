import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";

// Textarea che cresce con il testo: niente barre di scorrimento interne.
// Il `ref` esterno punta alla textarea vera, così si può mettere il cursore da fuori.
const AutoTextarea = forwardRef(function AutoTextarea({ value, minRows = 1, className = "", ...rest }, ref) {
  const inner = useRef(null);
  useImperativeHandle(ref, () => inner.current);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={inner}
      rows={minRows}
      value={value}
      className={`block w-full outline-none resize-none overflow-hidden p-0 border-0 ${className}`}
      {...rest}
    />
  );
});

export default AutoTextarea;
