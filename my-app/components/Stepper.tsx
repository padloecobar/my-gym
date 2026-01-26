"use client";

import { useEffect, useRef } from "react";

import { IconMinus, IconPlus } from "./Icons";

type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label?: string;
  format?: (value: number) => string;
};

const Stepper = ({
  value,
  onChange,
  step = 1,
  min = -Infinity,
  max = Infinity,
  label,
  format,
}: StepperProps) => {
  const holdRef = useRef<number | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const applyDelta = (delta: number) => {
    const next = Math.min(max, Math.max(min, valueRef.current + delta));
    onChange(Number.isFinite(next) ? next : value);
  };

  const startHold = (direction: 1 | -1) => {
    let ticks = 0;
    applyDelta(step * direction);
    holdRef.current = window.setInterval(() => {
      ticks += 1;
      const multiplier = ticks > 14 ? 5 : ticks > 6 ? 2 : 1;
      applyDelta(step * direction * multiplier);
    }, 120);
  };

  const stopHold = () => {
    if (holdRef.current) {
      window.clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-3 shadow-[var(--shadow)]">
      <div>
        {label ? (
          <div className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {label}
          </div>
        ) : null}
        <div className="text-xl font-semibold text-[color:var(--text)] font-mono">
          {format ? format(value) : value}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-full border border-[var(--border)] bg-[color:var(--chip)] text-[color:var(--text)]"
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          aria-label="Decrease"
        >
          <IconMinus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          aria-label="Increase"
        >
          <IconPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Stepper;
