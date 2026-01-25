"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { IconTrash } from "./Icons";

type SwipeRowProps = {
  children: ReactNode;
  onDelete: () => void;
};

const SwipeRow = ({ children, onDelete }: SwipeRowProps) => {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startX.current = event.clientX;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const delta = event.clientX - startX.current;
    if (delta >= 0) return;
    setOffset(Math.max(delta, -90));
  };

  const handlePointerUp = () => {
    if (offset < -50) {
      setOpen(true);
      setOffset(-90);
    } else {
      setOpen(false);
      setOffset(0);
    }
  };

  const handleReset = () => {
    setOpen(false);
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-[color:var(--danger)]">
        <button
          type="button"
          onClick={() => {
            onDelete();
            handleReset();
          }}
          className="flex flex-col items-center gap-1 text-xs uppercase tracking-[0.2em] text-white"
        >
          <IconTrash className="h-4 w-4" />
          Delete
        </button>
      </div>
      <div
        className="relative touch-pan-y"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div onClick={open ? handleReset : undefined}>{children}</div>
      </div>
    </div>
  );
};

export default SwipeRow;
