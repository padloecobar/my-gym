"use client";

import { useEffect, useRef } from "react";

import { DB_CHANGE_EVENT } from "../lib/db";
import { writeFileMirrorNow } from "../lib/fileMirror";

const FileMirrorSync = () => {
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const scheduleWrite = () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      // Debounce bursty changes (imports, multi-step edits) into one snapshot write.
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        void writeFileMirrorNow();
      }, 600);
    };

    window.addEventListener(DB_CHANGE_EVENT, scheduleWrite);
    return () => {
      window.removeEventListener(DB_CHANGE_EVENT, scheduleWrite);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return null;
};

export default FileMirrorSync;
