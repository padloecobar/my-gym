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
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <div className="flex items-center justify-between rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] px-3 py-2 shadow-[var(--shadow)]">
          {tabs.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-full px-3 text-[10px] uppercase tracking-[0.28em] transition ${
                  active
                    ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TabBar;
