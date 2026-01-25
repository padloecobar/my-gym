"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHistory, IconLog, IconProgress, IconSettings } from "./Icons";

const tabs = [
  { href: "/", label: "Log", Icon: IconLog },
  { href: "/history", label: "History", Icon: IconHistory },
  { href: "/progress", label: "Progress", Icon: IconProgress },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

const TabBar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[color:var(--bg-elev)]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-around px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                active
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--muted)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
