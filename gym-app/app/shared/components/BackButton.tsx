"use client";

import { useRouter } from "next/navigation";
import { backWithTransition } from "../lib/navigation";
import { ChevronIcon } from "./icons/ChevronIcon";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  const handle = () => {
    backWithTransition(router);
  };

  return (
    <button type="button" className="back-btn" onClick={handle} aria-label={label}>
      <ChevronIcon size="md" />
    </button>
  );
}
