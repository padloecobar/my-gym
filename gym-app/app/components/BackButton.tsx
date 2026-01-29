"use client";

import { useRouter } from "next/navigation";
import { backWithTransition } from "../../lib/navigation";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  const handle = () => {
    backWithTransition(router);
  };

  return (
    <button type="button" className="back-btn" onClick={handle} aria-label={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
