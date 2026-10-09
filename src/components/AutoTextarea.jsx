import React, { useLayoutEffect, useRef } from "react";

// Textarea che cresce con il testo: niente barre di scorrimento interne.
export default function AutoTextarea({ value, onChange, placeholder, minRows = 1, className = "" }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`block w-full outline-none resize-none overflow-hidden p-0 border-0 ${className}`}
    />
  );
}
