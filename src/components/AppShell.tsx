import type { ReactNode } from "react";
import type { User } from "@/lib/auth";
import { Logo } from "./Logo";
import { NavLinks, MobileNav } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { LinkButton } from "./ui";
import { IGithub } from "./icons";

const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/smaranz/scholarsat";

export function AppShell({ user, answered = 0, children }: { user: User | null; answered?: number; children: ReactNode }) {
  const account = user ? (
    <UserMenu name={user.name} email={user.email} answered={answered} />
  ) : (
    <div className="grid gap-2">
      <LinkButton href="/signup" className="w-full">Create free account</LinkButton>
      <LinkButton href="/login" variant="ghost" className="w-full">Log in</LinkButton>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white px-3 pb-3 pt-5 lg:flex">
        <div className="px-2">
          <Logo href={user ? "/dashboard" : "/"} size={40} />
        </div>
        <nav className="scroll-thin mt-7 flex-1 overflow-y-auto" aria-label="Main">
          <NavLinks />
        </nav>
        <a href={REPO} target="_blank" rel="noopener noreferrer" className="mb-3 block rounded-xl bg-gradient-to-br from-red to-red-600 p-3.5 text-white transition-transform hover:-translate-y-0.5">
          <p className="flex items-center gap-2 text-sm font-medium"><IGithub className="h-4 w-4" /> 100% free, forever</p>
          <ul className="mt-1.5 list-disc pl-5 text-xs text-white/85">
            <li>No paywalls or trials</li>
            <li>Open source on GitHub</li>
          </ul>
        </a>
        <div className="border-t border-line pt-2">{account}</div>
      </aside>
      <div className="min-w-0">
        <MobileNav signedIn={!!user} footer={account} />
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
