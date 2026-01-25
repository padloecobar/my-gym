import type { BackupPayload, Exercise, SetEntry, SettingsState } from "./types";

export const serializeBackup = (
  exercises: Exercise[],
  sets: SetEntry[],
  settings: SettingsState,
): string => {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    exercises,
    sets,
    settings,
  };
  return JSON.stringify(payload, null, 2);
};

export const parseBackup = (text: string): BackupPayload => {
  const data = JSON.parse(text) as BackupPayload;
  if (!data || !Array.isArray(data.exercises) || !Array.isArray(data.sets)) {
    throw new Error("Invalid backup format");
  }
  return data;
};

const csvEscape = (value: string | number | null | undefined) => {
  const text = value == null ? "" : String(value);
  if (/[,\n"]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const serializeSetsCsv = (
  sets: SetEntry[],
  exercises: Exercise[],
): string => {
  const nameById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const header = [
    "date",
    "exercise",
    "type",
    "reps",
    "inputLb",
    "barLbSnapshot",
    "totalLb",
    "totalKg",
    "note",
    "tags",
    "rpe",
    "ts",
  ];
  const rows = sets.map((set) => {
    const exercise = nameById.get(set.exerciseId);
    return [
      set.date,
      exercise?.name ?? "",
      exercise?.type ?? "",
      set.reps,
      set.inputLb,
      set.barLbSnapshot,
      set.totalLb,
      set.totalKg,
      set.note ?? "",
      set.tags?.join("|") ?? "",
      set.meta?.rpe ?? "",
      set.ts,
    ].map(csvEscape);
  });
  return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
};

export type CsvSetRow = {
  date: string;
  exercise: string;
  type?: string;
  reps: number;
  inputLb: number;
  barLbSnapshot: number;
  totalLb: number;
  totalKg: number;
  note?: string;
  tags?: string[];
  rpe?: number;
  ts?: number;
};

export const parseSetsCsv = (text: string): CsvSetRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];
  const header = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = values[index] ?? "";
    });
    return {
      date: record.date,
      exercise: record.exercise,
      type: record.type || undefined,
      reps: Number(record.reps || 0),
      inputLb: Number(record.inputlb || record.inputLb || 0),
      barLbSnapshot: Number(record.barlbsnapshot || record.barLbSnapshot || 0),
      totalLb: Number(record.totallb || record.totalLb || 0),
      totalKg: Number(record.totalkg || record.totalKg || 0),
      note: record.note || undefined,
      tags: record.tags ? record.tags.split("|") : undefined,
      rpe: record.rpe ? Number(record.rpe) : undefined,
      ts: record.ts ? Number(record.ts) : undefined,
    };
  });
};
