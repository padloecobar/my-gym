"use client";

import { useRouter } from "next/navigation";
import { SVGProps } from "react";
import { backWithTransition } from "../../lib/navigation";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  const handle = () => {
    backWithTransition(router);
  };

  return (
    <button type="button" className="btn" onClick={handle} aria-label={label}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ marginLeft: 8 }}>{label}</span>
    </button>
  );
}
