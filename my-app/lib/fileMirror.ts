import { serializeBackup } from "./backup";
import {
  getAllExercises,
  getAllSessions,
  getAllSets,
  getAllSettings,
  getMirrorHandle,
  getMirrorLastWrite,
  setMirrorHandle,
  setMirrorLastWrite,
} from "./db";
import { defaultSettings } from "./defaults";

import type { SettingsState } from "./types";

export type FileMirrorState = {
  supported: boolean;
  enabled: boolean;
  fileName: string | null;
  lastWrite: number | null;
};

export type FileMirrorEnableResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "cancelled" | "permission" | "failed" };

export type FileMirrorWriteResult =
  | { ok: true; lastWrite: number }
  | { ok: false; reason: "unsupported" | "not-enabled" | "permission" | "write-failed" };

type FileSystemHandleWithPermissions = FileSystemFileHandle & {
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

type FilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
};

type FilePickerWindow = Window &
  typeof globalThis & {
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
  };

let writePromise: Promise<FileMirrorWriteResult> | null = null;

export const isFileMirrorSupported = () =>
  typeof window !== "undefined" && "showSaveFilePicker" in window;

const mirrorTypes: NonNullable<FilePickerOptions["types"]> = [
  {
    description: "Gym log (JSON)",
    accept: { "application/json": [".json"] },
  },
];

const ensureHandlePermission = async (handle: FileSystemFileHandle) => {
  const permissionHandle = handle as FileSystemHandleWithPermissions;
  const options = { mode: "readwrite" as const };
  if (typeof permissionHandle.queryPermission !== "function") return true;
  const current = await permissionHandle.queryPermission(options);
  if (current === "granted") return true;
  if (typeof permissionHandle.requestPermission !== "function") return false;
  const requested = await permissionHandle.requestPermission(options);
  return requested === "granted";
};

const buildMirrorPayload = async () => {
  const [exercises, sessions, sets, settingsData] = await Promise.all([
    getAllExercises(),
    getAllSessions(),
    getAllSets(),
    getAllSettings(),
  ]);
  const settings = { ...defaultSettings, ...settingsData } as SettingsState;
  const payload = serializeBackup(exercises, sets, settings, sessions, {
    pretty: true,
  });
  return payload;
};

const writeMirrorWithHandle = async (
  handle: FileSystemFileHandle,
): Promise<FileMirrorWriteResult> => {
  const allowed = await ensureHandlePermission(handle);
  if (!allowed) return { ok: false, reason: "permission" };
  try {
    const payload = await buildMirrorPayload();
    const writable = await handle.createWritable();
    await writable.write(payload);
    await writable.close();
  } catch (error) {
    console.error(error);
    return { ok: false, reason: "write-failed" };
  }
  const lastWrite = Date.now();
  await setMirrorLastWrite(lastWrite);
  return { ok: true, lastWrite };
};

export const getFileMirrorState = async (): Promise<FileMirrorState> => {
  if (!isFileMirrorSupported()) {
    return {
      supported: false,
      enabled: false,
      fileName: null,
      lastWrite: null,
    };
  }
  const [handle, lastWrite] = await Promise.all([
    getMirrorHandle(),
    getMirrorLastWrite(),
  ]);
  return {
    supported: true,
    enabled: Boolean(handle),
    fileName: handle?.name ?? null,
    lastWrite: lastWrite ?? null,
  };
};

export const enableFileMirror = async (): Promise<FileMirrorEnableResult> => {
  if (!isFileMirrorSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  let handle: FileSystemFileHandle;
  try {
    const pickerWindow = window as FilePickerWindow;
    if (!pickerWindow.showSaveFilePicker) {
      return { ok: false, reason: "unsupported" };
    }
    handle = await pickerWindow.showSaveFilePicker({
      suggestedName: "gym-log.json",
      types: mirrorTypes,
      excludeAcceptAllOption: true,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "cancelled" };
    }
    console.error(error);
    return { ok: false, reason: "failed" };
  }
  const allowed = await ensureHandlePermission(handle);
  if (!allowed) return { ok: false, reason: "permission" };
  await setMirrorHandle(handle);
  return { ok: true };
};

export const disableFileMirror = async () => {
  await setMirrorHandle(null);
  await setMirrorLastWrite(null);
};

export const writeFileMirrorNow = async (): Promise<FileMirrorWriteResult> => {
  if (writePromise) return writePromise;
  writePromise = (async () => {
    try {
      if (!isFileMirrorSupported()) {
        return { ok: false, reason: "unsupported" };
      }
      const handle = await getMirrorHandle();
      if (!handle) return { ok: false, reason: "not-enabled" };
      return writeMirrorWithHandle(handle);
    } catch (error) {
      console.error(error);
      return { ok: false, reason: "write-failed" };
    }
  })();
  try {
    return await writePromise;
  } finally {
    writePromise = null;
  }
};
