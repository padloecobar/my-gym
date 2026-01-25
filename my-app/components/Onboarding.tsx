"use client";

import { useState } from "react";
import Stepper from "./Stepper";

type OnboardingProps = {
  open: boolean;
  defaultBarLb: number;
  onComplete: (barLb: number) => void;
};

const Onboarding = ({ open, defaultBarLb, onComplete }: OnboardingProps) => {
  const [barLb, setBarLb] = useState(defaultBarLb);
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--bg)] px-6 py-8">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-6 shadow-[var(--shadow)]">
        <div className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
          Welcome
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-[color:var(--text)]">
          Set your bar, then log fast.
        </h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          For barbell lifts you enter plates on one side only. We handle totals
          and kg conversions automatically.
        </p>

        <div className="mt-6">
          <Stepper
            value={barLb}
            onChange={setBarLb}
            step={5}
            min={10}
            max={70}
            label="Bar weight (lb)"
          />
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-3 text-sm text-[color:var(--text)]">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="h-5 w-5 accent-[color:var(--accent)]"
          />
          I will enter plate weight for one side only.
        </label>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-card)] p-4 text-sm text-[color:var(--muted)]">
          <div className="font-semibold text-[color:var(--text)]">
            Preloaded plan
          </div>
          <div className="mt-2">Workout A: Squat, Bench Press, Lat Pulldown</div>
          <div className="mt-1">Workout B: Deadlift, Overhead Press, Row</div>
        </div>

        <button
          type="button"
          onClick={() => onComplete(barLb)}
          disabled={!confirmed}
          className="mt-6 w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black disabled:opacity-40"
        >
          Start Logging
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
