import { Suspense } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NavLinks } from "@/components/nav-links";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="h-16 w-full border-b border-b-foreground/10">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Link href="/protected" className="font-semibold">
              Study Tracker
            </Link>
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-5xl flex-1 p-5">{children}</main>
    </div>
  );
}