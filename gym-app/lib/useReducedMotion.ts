"use client";

import { useSyncExternalStore } from "react";
import { useSettingsShallow } from "../store/useSettingsStore";

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

const getSnapshot = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/** Returns true if OS prefers reduced motion (legacy hook for backward compatibility) */
export const useReducedMotion = () => {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

/**
 * Unified motion mode hook per improve-1.md guidelines.
 * Returns "reduced" if OS prefers reduced motion OR user toggled app setting.
 * Returns "full" otherwise.
 */
export function useMotionMode(): "reduced" | "full" {
  const osPrefers = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const { reduceMotion } = useSettingsShallow((s) => ({ reduceMotion: s.settings.reduceMotion }));
  
  return osPrefers || reduceMotion ? "reduced" : "full";
}
