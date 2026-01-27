"use client";

import { usePathname } from "next/navigation";
import VtLink from "./VtLink";

const items = [
  { href: "/", label: "Today" },
  { href: "/programs", label: "Programs" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <VtLink
            key={item.href}
            href={item.href}
            className="bottom-nav__item"
            ariaCurrent={isActive ? "page" : "false"}
          >
            <span className="bottom-nav__label">{item.label}</span>
          </VtLink>
        );
      })}
    </nav>
  );
}
