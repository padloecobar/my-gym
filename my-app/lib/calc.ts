import type { E1RMFormula, ExerciseType } from "./types";

export const LB_TO_KG = 0.45359237;

const getDecimals = (value: number) => {
  const text = value.toString();
  if (!text.includes(".")) return 0;
  return text.split(".")[1]?.length ?? 0;
};

export const toKg = (lb: number, rounding = 0.1): number => {
  const value = lb * LB_TO_KG;
  if (rounding <= 0) return value;
  return Math.round(value / rounding) * rounding;
};

export const computeTotals = (
  inputLb: number,
  type: ExerciseType,
  barLb: number,
  rounding = 0.1,
  perSide = true,
) => {
  let totalLb = inputLb;
  switch (type) {
    case "barbell":
      totalLb = perSide ? inputLb * 2 + barLb : inputLb;
      break;
    case "dumbbell":
      totalLb = perSide ? inputLb * 2 : inputLb;
      break;
    case "bodyweight":
      totalLb = 0;
      break;
    default:
      totalLb = inputLb;
  }
  const totalKg = toKg(totalLb, rounding);
  return { totalLb, totalKg };
};

export const formatLb = (lb: number) => {
  if (Number.isInteger(lb)) return lb.toString();
  return lb.toFixed(1);
};

export const formatKg = (kg: number, rounding = 0.1) => {
  if (rounding <= 0) return kg.toFixed(2);
  return kg.toFixed(getDecimals(rounding));
};

export const estimateE1RM = (
  weightLb: number,
  reps: number,
  formula: E1RMFormula,
) => {
  if (reps <= 1) return weightLb;
  if (formula === "brzycki") {
    if (reps >= 37) return weightLb;
    return weightLb * (36 / (37 - reps));
  }
  return weightLb * (1 + reps / 30);
};
