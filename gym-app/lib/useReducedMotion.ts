"use client";

import { useSyncExternalStore } from "react";

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

export const useReducedMotion = () => {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};
