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
  const [step, setStep] = useState<1 | 2>(1);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--bg)] px-6 py-8">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-elev)] p-6 shadow-[var(--shadow)]">
        <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
          Welcome
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-[color:var(--text)] font-serif">
          Set up once. Log fast forever.
        </h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          We log per side for barbells and calculate totals automatically.
        </p>

        {step === 1 ? (
          <>
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
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-ink)]"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <label className="mt-5 flex min-h-[48px] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-3 text-sm text-[color:var(--text)]">
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

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[44px] rounded-2xl border border-[var(--border)] px-4 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => onComplete(barLb)}
                disabled={!confirmed}
                className="min-h-[44px] rounded-2xl bg-[color:var(--accent)] px-4 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-ink)] disabled:opacity-40"
              >
                Start logging
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
