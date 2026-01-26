"use client";

import { useEffect, useMemo, useState } from "react";

import { computeTotals, formatKg, formatLb } from "@/lib/calc";

import BottomSheet from "./BottomSheet";
import Chip from "./Chip";
import Stepper from "./Stepper";

import type { Exercise, SetEntry, SettingsState } from "@/lib/types";

export type SetDraft = {
  inputLb: number;
  reps: number;
  tags: string[];
  note: string;
  rpe?: number;
};

type SetSeed = {
  inputLb: number;
  reps: number;
  tags?: string[];
  note?: string;
  rpe?: number;
};

type SetComposerProps = {
  open: boolean;
  mode?: "create" | "edit";
  exercise: Exercise | null;
  settings: SettingsState;
  seed?: SetSeed | null;
  initial?: SetEntry | null;
  onClose: () => void;
  onSave: (draft: SetDraft) => void;
  onDelete?: () => void;
};

const SetComposer = ({
  open,
  mode = "create",
  exercise,
  settings,
  seed,
  initial,
  onClose,
  onSave,
  onDelete,
}: SetComposerProps) => {
  const [inputLb, setInputLb] = useState(0);
  const [reps, setReps] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [rpe, setRpe] = useState<number | undefined>(undefined);

  const isBodyweight = exercise?.type === "bodyweight";
  const isDumbbell = exercise?.type === "dumbbell";
  const isBarbell = exercise?.type === "barbell";
  const perSide = isBarbell || isDumbbell ? exercise?.perSide ?? true : false;

  // Sync draft state when opening or switching exercises.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !exercise) return;
    const base = mode === "edit" ? initial : seed;
    const baseInput = base?.inputLb ?? settings.weightPresets[2] ?? settings.barLb;
    const baseReps = base?.reps ?? settings.repPresets[1] ?? 8;
    const baseTags = mode === "edit" ? initial?.tags ?? [] : seed?.tags ?? [];
    const baseNote = mode === "edit" ? initial?.note ?? "" : seed?.note ?? "";
    const baseRpe = mode === "edit" ? initial?.meta?.rpe : seed?.rpe;
    setInputLb(isBodyweight ? 0 : baseInput);
    setReps(baseReps);
    setTags(baseTags);
    setNote(baseNote);
    setRpe(baseRpe);
  }, [exercise, initial, mode, open, seed, settings, isBodyweight]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totals = useMemo(() => {
    if (!exercise || isBodyweight) return null;
    return computeTotals(
      inputLb,
      exercise.type,
      settings.barLb,
      settings.roundingKg,
      perSide,
    );
  }, [exercise, inputLb, isBodyweight, perSide, settings.barLb, settings.roundingKg]);

  if (!exercise) return null;

  const unitDisplay = settings.unitDisplay;
  const showLb = unitDisplay === "both" || unitDisplay === "lb";
  const showKg = unitDisplay === "both" || unitDisplay === "kg";
  const weightDescriptor = isBarbell
    ? perSide
      ? "Per side"
      : "Total on bar"
    : isDumbbell
      ? perSide
        ? "Per dumbbell"
        : "Total load"
      : "Weight";
  const weightStep = isBarbell ? (perSide ? 2.5 : 5) : 5;
  const minWeight = isBarbell && !perSide ? settings.barLb : 0;
  const plateSide = isBarbell
    ? perSide
      ? inputLb
      : Math.max(0, (inputLb - settings.barLb) / 2)
    : null;
  const weightJumps = isBarbell
    ? perSide
      ? [2.5, 5, 10]
      : [5, 10, 20]
    : [5, 10, 20];
  const repPresets = settings.repPresets.length
    ? settings.repPresets
    : [5, 8, 10, 12];
  const warmupActive = tags.includes("warmup");

  const toggleWarmup = () => {
    setTags((prev) => {
      if (prev.includes("warmup")) {
        return prev.filter((tag) => tag !== "warmup");
      }
      return [...prev, "warmup"];
    });
  };

  const handleSave = () => {
    const normalizedInput = isBodyweight ? 0 : inputLb;
    onSave({
      inputLb: normalizedInput,
      reps,
      tags,
      note,
      rpe,
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit set" : "Log set"}
      footer={
        <div className="flex items-center gap-3">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm uppercase tracking-[0.2em] text-[color:var(--danger)]"
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-ink)]"
          >
            {mode === "edit" ? "Save changes" : "Log set"}
          </button>
        </div>
      }
    >
      <section className="flex flex-col gap-4">
        {!isBodyweight ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                  Weight
                </div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  {weightDescriptor} (lb)
                </div>
              </div>
              {totals ? (
                <div className="text-right text-[11px] text-[color:var(--muted)]">
                  <div className="uppercase tracking-[0.3em]">Total</div>
                  <div className="mt-1 font-mono text-sm text-[color:var(--text)]">
                    {showLb ? `${formatLb(totals.totalLb)} lb` : null}
                    {showLb && showKg ? " | " : null}
                    {showKg
                      ? `${formatKg(totals.totalKg, settings.roundingKg)} kg`
                      : null}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-3 text-3xl font-semibold text-[color:var(--text)] font-mono">
              {formatLb(inputLb)} lb
            </div>
            {isBarbell ? (
              <div className="mt-1 text-[11px] text-[color:var(--muted)]">
                Per side {formatLb(plateSide ?? 0)} lb · Bar {settings.barLb} lb
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {weightJumps.map((delta) => (
                <Chip
                  key={delta}
                  size="sm"
                  onClick={() =>
                    setInputLb((prev) => Math.max(minWeight, prev + delta))
                  }
                >
                  +{delta}
                </Chip>
              ))}
            </div>
            <div className="mt-3">
              <Stepper
                value={inputLb}
                onChange={setInputLb}
                step={weightStep}
                min={minWeight}
                label={weightDescriptor}
                format={formatLb}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4 text-sm text-[color:var(--muted)]">
            Logging bodyweight reps only.
          </div>
        )}

        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Reps
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {repPresets.map((rep) => (
              <Chip
                key={rep}
                selected={reps === rep}
                onClick={() => setReps(rep)}
              >
                {rep}
              </Chip>
            ))}
          </div>
          <div className="mt-3">
            <Stepper value={reps} onChange={setReps} step={1} min={1} />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                Tags
              </div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">
                Tap to mark warmup
              </div>
            </div>
            <button
              type="button"
              onClick={toggleWarmup}
              className={`min-h-[44px] rounded-full border px-4 text-xs uppercase tracking-[0.3em] transition ${
                warmupActive
                  ? "border-[var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                  : "border-[var(--border)] bg-transparent text-[color:var(--muted)]"
              }`}
            >
              Warmup
            </button>
          </div>
        </div>
      </section>
    </BottomSheet>
  );
};

export default SetComposer;
