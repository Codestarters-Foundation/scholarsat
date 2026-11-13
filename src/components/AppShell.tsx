import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@/lib/auth";
import { Logo } from "./Logo";
import { NavLinks, MobileNav } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";

export function AppShell({ user, children }: { user: User | null; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface/60 lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo href={user ? "/dashboard" : "/"} />
        </div>
        <nav className="mt-8 flex-1" aria-label="Main">
          <NavLinks />
        </nav>
        <div className="rounded-2xl border border-gold-100 bg-gold-50 p-4 text-sm">
          <p className="font-semibold text-ink">100% free, forever</p>
          <p className="mt-1 text-muted">ScholarSAT is open source. No paywalls, no upsells.</p>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          {user ? (
            <div className="flex items-center justify-between gap-2 px-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <div className="grid gap-2">
              <Link href="/signup" className="rounded-xl bg-red px-3 py-2 text-center text-sm font-semibold text-white hover:bg-red-600">Create free account</Link>
              <Link href="/login" className="rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:bg-surface">Log in</Link>
            </div>
          )}
        </div>
      </aside>
      <div className="min-w-0">
        <MobileNav signedIn={!!user} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
