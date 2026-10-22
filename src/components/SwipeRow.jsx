import React, { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

// Riga dell'elenco che si scorre verso sinistra, come in Note di Apple:
// - scorrimento breve: compare il pulsante rosso "Elimina" (toccalo per eliminare)
// - scorrimento lungo (oltre metà riga): elimina subito
// - tocco altrove o scorrimento a destra: la riga si richiude
// Solo dito (touch/penna): con il mouse la riga resta un semplice pulsante.

const ACTION_W = 84; // larghezza del pulsante rosso
const OPEN_AT = 40; // oltre questa distanza la riga resta aperta
const FULL_RATIO = 0.5; // oltre metà della riga: eliminazione diretta

export default function SwipeRow({ id, openId, setOpenId, onOpen, onDelete, className = "", children }) {
  const rowRef = useRef(null);
  const start = useRef(null); // { x, y, base, axis }
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const isOpen = openId === id;

  // se si apre un'altra riga, questa si richiude
  useEffect(() => {
    if (!isOpen && !dragging) setDx(0);
  }, [isOpen, dragging]);

  const width = () => rowRef.current?.offsetWidth || 320;

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" || removing) return;
    start.current = { x: e.clientX, y: e.clientY, base: isOpen ? -ACTION_W : 0, axis: null };
  };

  const onPointerMove = (e) => {
    const s = start.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      s.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
      if (s.axis === "x") {
        setDragging(true);
        if (openId !== id) setOpenId(null);
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
    }
    if (s.axis !== "x") return;
    // solo verso sinistra; un po' di resistenza oltre il bordo destro
    const next = Math.min(0, s.base + mx);
    setDx(next > 0 ? next / 4 : next);
  };

  const finish = (e) => {
    const s = start.current;
    start.current = null;
    if (!s || s.axis !== "x") return;
    e?.preventDefault?.();
    setDragging(false);
    const w = width();
    if (-dx > w * FULL_RATIO) {
      doDelete();
    } else if (-dx > OPEN_AT) {
      setDx(-ACTION_W);
      setOpenId(id);
    } else {
      setDx(0);
      if (isOpen) setOpenId(null);
    }
  };

  const doDelete = () => {
    setRemoving(true);
    setDx(-width());
    setOpenId(null);
    setTimeout(() => onDelete(id), 220);
  };

  const onClick = (e) => {
    // dopo uno scorrimento il "click" non deve aprire la nota
    if (dragging) return e.preventDefault();
    if (isOpen || dx !== 0) {
      setOpenId(null);
      setDx(0);
      return;
    }
    onOpen(id);
  };

  const reveal = Math.min(1, -dx / ACTION_W);

  return (
    <div
      ref={rowRef}
      className={`relative overflow-hidden ${removing ? "max-h-0 opacity-0" : "max-h-40"} transition-[max-height,opacity] duration-200 ease-out ${className}`}
    >
      {/* pulsante rosso dietro la riga */}
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
        onClick={doDelete}
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-[#e5483d] text-white"
        style={{ width: Math.max(ACTION_W, -dx), opacity: reveal > 0 ? 1 : 0 }}
      >
        <span className="flex w-[84px] flex-col items-center justify-center gap-0.5 text-[13px] font-semibold">
          <Trash2 size={20} />
          Elimina
        </span>
      </button>

      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onContextMenu={(e) => dragging && e.preventDefault()}
        className="relative block w-full bg-panel px-4 py-3 text-left active:opacity-60"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 220ms cubic-bezier(0.32,0.72,0,1)",
          touchAction: "pan-y",
        }}
      >
        {children}
      </button>
    </div>
  );
}
