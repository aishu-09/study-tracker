"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/protected", label: "Home" },
  { href: "/protected/analytics", label: "Analytics" },
  { href: "/protected/user", label: "User" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4 text-sm">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname === href
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}