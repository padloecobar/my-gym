"use client";

import { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import Chip from "./Chip";
import Stepper from "./Stepper";
import { IconChevronDown, IconKeyboard } from "./Icons";
import { computeTotals, formatKg, formatLb } from "../lib/calc";
import type { Exercise, SetEntry, SettingsState } from "../lib/types";
import { DEFAULT_TAGS } from "../lib/defaults";

type SetDraft = {
  inputLb: number;
  reps: number;
  tags: string[];
  note: string;
  rpe?: number;
};

type ParsedSet = {
  inputLb: number;
  reps: number;
};

const STANDARD_PLATES = [45, 35, 25, 10, 5, 2.5];

const buildPlateBreakdown = (weight: number) => {
  let remaining = Math.max(0, weight);
  const plates: number[] = [];
  for (const plate of STANDARD_PLATES) {
    while (remaining + 0.001 >= plate) {
      plates.push(plate);
      remaining = Number((remaining - plate).toFixed(2));
    }
  }
  return { plates, remaining };
};

type SetBuilderProps = {
  open: boolean;
  mode?: "create" | "edit";
  exercise: Exercise | null;
  settings: SettingsState;
  lastSet?: SetEntry | null;
  initial?: SetEntry | null;
  onClose: () => void;
  onSave: (draft: SetDraft) => void;
  onSaveMany?: (drafts: ParsedSet[]) => void;
  onQuickSave?: (draft: SetDraft) => void;
  onDelete?: () => void;
};

const parseQuickInput = (text: string): ParsedSet[] => {
  const cleaned = text.toLowerCase().replace(/lb/g, "");
  if (!cleaned) return [];
  const results: ParsedSet[] = [];
  const pattern = /(\d+(?:\.\d+)?)[xX]([\d,]+)/g;
  for (const match of cleaned.matchAll(pattern)) {
    const weight = Number(match[1]);
    const repsList = match[2];
    if (Number.isNaN(weight)) continue;
    repsList.split(",").forEach((repText) => {
      const reps = Number(repText);
      if (!Number.isNaN(reps)) {
        results.push({ inputLb: weight, reps });
      }
    });
  }
  return results;
};

const SetBuilder = ({
  open,
  mode = "create",
  exercise,
  settings,
  lastSet,
  initial,
  onClose,
  onSave,
  onSaveMany,
  onQuickSave,
  onDelete,
}: SetBuilderProps) => {
  const [inputLb, setInputLb] = useState(0);
  const [reps, setReps] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [showNote, setShowNote] = useState(false);
  const [showRpe, setShowRpe] = useState(false);
  const [showQuickParse, setShowQuickParse] = useState(false);
  const [quickParseText, setQuickParseText] = useState("");

  const isBodyweight = exercise?.type === "bodyweight";
  const isDumbbell = exercise?.type === "dumbbell";
  const isBarbell = exercise?.type === "barbell";
  const perSide = isBarbell || isDumbbell ? exercise?.perSide ?? true : false;
  const weightStep = isBarbell ? (perSide ? 2.5 : 5) : 5;

  // Sync draft state when opening or switching exercises.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !exercise) return;
    const base = initial ?? lastSet;
    setInputLb(
      exercise.type === "bodyweight"
        ? 0
        : base?.inputLb ?? settings.weightPresets[2] ?? settings.barLb,
    );
    setReps(base?.reps ?? settings.repPresets[1] ?? 5);
    setTags(base?.tags ?? []);
    setNote(base?.note ?? "");
    setRpe(base?.meta?.rpe ?? undefined);
    setShowNote(Boolean(base?.note));
    setShowRpe(Boolean(base?.meta?.rpe));
    setShowQuickParse(false);
    setQuickParseText("");
  }, [open, exercise, initial, lastSet, settings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totals = useMemo(() => {
    if (!exercise) return null;
    return computeTotals(
      inputLb,
      exercise.type,
      settings.barLb,
      settings.roundingKg,
      perSide,
    );
  }, [exercise, inputLb, perSide, settings.barLb, settings.roundingKg]);

  if (!exercise) return null;

  const unitDisplay = settings.unitDisplay;
  const showLb = unitDisplay === "both" || unitDisplay === "lb";
  const showKg = unitDisplay === "both" || unitDisplay === "kg";
  const referenceSet = initial ?? lastSet;
  const lastSummary = referenceSet
    ? exercise.type === "bodyweight"
      ? `BWx${referenceSet.reps}`
      : `${formatLb(referenceSet.inputLb)}x${referenceSet.reps}`
    : null;
  const weightDescriptor = isBarbell
    ? perSide
      ? "Per side"
      : "Total on bar"
    : isDumbbell
      ? perSide
        ? "Per dumbbell"
        : "Total load"
      : "Weight";
  const plateInput = isBarbell
    ? perSide
      ? inputLb
      : Math.max(0, (inputLb - settings.barLb) / 2)
    : inputLb;
  const plateBreakdown = isBarbell ? buildPlateBreakdown(plateInput) : null;
  const showPlates =
    isBarbell &&
    plateBreakdown &&
    plateBreakdown.plates.length > 0 &&
    plateBreakdown.remaining < 0.01;

  const handleSave = () => {
    const normalizedInput = exercise.type === "bodyweight" ? 0 : inputLb;
    onSave({ inputLb: normalizedInput, reps, tags, note, rpe });
    if (mode === "create") {
      setNote("");
      setShowNote(false);
    }
  };

  const handleQuickSave = (repValue: number) => {
    if (!onQuickSave) return;
    const normalizedInput = exercise.type === "bodyweight" ? 0 : inputLb;
    onQuickSave({ inputLb: normalizedInput, reps: repValue, tags, note, rpe });
  };

  const handleQuickParse = () => {
    if (!onSaveMany) return;
    const parsed = parseQuickInput(quickParseText);
    if (parsed.length === 0) return;
    onSaveMany(parsed);
    setQuickParseText("");
    setShowQuickParse(false);
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
        {lastSummary ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[color:var(--bg-elev)] p-3 text-sm text-[color:var(--muted)]">
            <div className="text-[10px] uppercase tracking-[0.3em]">Last logged</div>
            <div className="mt-1 text-base font-semibold text-[color:var(--text)] font-mono">
              {lastSummary}
            </div>
          </div>
        ) : null}
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
            <div className="mt-2 text-3xl font-semibold text-[color:var(--text)] font-mono">
              {formatLb(inputLb)}
            </div>
            {isBarbell ? (
              <div className="mt-1 text-[11px] text-[color:var(--muted)]">
                Bar {settings.barLb} lb {perSide ? "included" : "inside total"}
              </div>
            ) : null}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {settings.weightPresets.map((preset) => (
                <Chip
                  key={preset}
                  size="sm"
                  selected={Math.abs(inputLb - preset) < 0.01}
                  onClick={() => setInputLb(preset)}
                >
                  {preset}
                </Chip>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 2.5, 1].map((delta) => (
                <Chip
                  key={delta}
                  size="sm"
                  onClick={() => setInputLb((prev) => Math.max(0, prev + delta))}
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
                min={0}
                label={weightDescriptor}
                format={formatLb}
              />
            </div>
            {showPlates ? (
              <div className="mt-2 text-[11px] text-[color:var(--muted)]">
                Plates (std):{" "}
                {plateBreakdown?.plates.map((plate) => formatLb(plate)).join(" + ")}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Reps
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {settings.repPresets.map((rep) => (
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

        {mode === "create" && onQuickSave ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
            <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Rapid log
            </div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              Tap reps to log immediately
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {settings.repPresets.map((rep) => (
                <Chip key={rep} onClick={() => handleQuickSave(rep)}>
                  {rep}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Tags + notes
          </div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Tap to toggle
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEFAULT_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <Chip
                  key={tag}
                  selected={selected}
                  onClick={() =>
                    setTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((item) => item !== tag)
                        : [...prev, tag],
                    )
                  }
                >
                  {tag}
                </Chip>
              );
            })}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowNote((prev) => !prev)}
              className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--muted)]"
            >
              Add note
              <IconChevronDown className={`h-4 w-4 ${showNote ? "rotate-180" : ""}`} />
            </button>
            {showNote ? (
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[color:var(--bg-card)] px-3 py-2 text-sm text-[color:var(--text)]"
                rows={2}
              />
            ) : null}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowRpe((prev) => !prev)}
              className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--muted)]"
            >
              RPE
              <IconChevronDown className={`h-4 w-4 ${showRpe ? "rotate-180" : ""}`} />
            </button>
            {showRpe ? (
              <div className="mt-2">
                <Stepper
                  value={rpe ?? 8}
                  onChange={(next) => setRpe(next)}
                  step={0.5}
                  min={6}
                  max={10}
                />
              </div>
            ) : null}
          </div>
        </div>

        {mode === "create" && !isBodyweight ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
            <button
              type="button"
              onClick={() => setShowQuickParse((prev) => !prev)}
              className="flex min-h-[44px] w-full items-center justify-between text-sm text-[color:var(--muted)]"
            >
              <span className="flex items-center gap-2">
                <IconKeyboard className="h-4 w-4" />
                Quick entry
              </span>
              <IconChevronDown
                className={`h-4 w-4 ${showQuickParse ? "rotate-180" : ""}`}
              />
            </button>
            {showQuickParse ? (
              <div className="mt-3 space-y-2">
                <input
                  value={quickParseText}
                  onChange={(event) => setQuickParseText(event.target.value)}
                  placeholder="45x12,10,8"
                  className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[color:var(--bg-card)] px-3 py-2 text-sm text-[color:var(--text)]"
                />
                <button
                  type="button"
                  onClick={handleQuickParse}
                  className="min-h-[44px] w-full rounded-xl bg-[color:var(--accent-2)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-ink)]"
                >
                  Log parsed sets
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </BottomSheet>
  );
};

export default SetBuilder;
