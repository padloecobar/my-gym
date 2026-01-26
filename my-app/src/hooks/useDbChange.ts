import { useEffect } from "react";
import { DB_CHANGE_EVENT } from "../../lib/db";

type DbChangeDetail = {
  source: string;
  ts: number;
};

export const useDbChange = (onChange: (detail: DbChangeDetail) => void) => {
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DbChangeDetail>).detail;
      if (!detail) return;
      onChange(detail);
    };
    window.addEventListener(DB_CHANGE_EVENT, handler);
    return () => window.removeEventListener(DB_CHANGE_EVENT, handler);
  }, [onChange]);
};

export type { DbChangeDetail };
