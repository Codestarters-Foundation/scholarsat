"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IBook, ICards, IClock, IGear, IHome, ILink, IMenu, IRefresh, IX } from "./icons";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: IHome },
  { href: "/practice", label: "Question Bank", Icon: IBook },
  { href: "/tests", label: "Practice Tests", Icon: IClock },
  { href: "/review", label: "Review", Icon: IRefresh },
  { href: "/vocab", label: "Vocabulary", Icon: ICards },
  { href: "/resources", label: "Official Resources", Icon: ILink },
  { href: "/settings", label: "Settings", Icon: IGear },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <ul className="grid gap-1">
      {LINKS.map(({ href, label, Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-red-50 text-red" : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo href={signedIn ? "/dashboard" : "/"} size={30} />
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-ink hover:bg-surface" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <IX /> : <IMenu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line px-3 pb-4 pt-2" aria-label="Main">
          <NavLinks onNavigate={() => setOpen(false)} />
          {!signedIn && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/login" className="rounded-xl border border-line px-3 py-2 text-center text-sm font-semibold">Log in</Link>
              <Link href="/signup" className="rounded-xl bg-red px-3 py-2 text-center text-sm font-semibold text-white">Sign up</Link>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
