"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IBook, ICards, IExam, IHome, ILink, IMenu, IRefresh, IX } from "./icons";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/dashboard", label: "Home", Icon: IHome },
  { href: "/practice", label: "Question Bank", Icon: IBook, tag: "FREE" },
  { href: "/tests", label: "Practice Tests", Icon: IExam },
  { href: "/review", label: "Review", Icon: IRefresh },
  { href: "/vocab", label: "Vocab", Icon: ICards },
  { href: "/resources", label: "Resources", Icon: ILink },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <ul className="grid gap-1">
      {LINKS.map(({ href, label, Icon, tag }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                active ? "bg-red-50 font-medium text-red" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon className="h-[20px] w-[20px] shrink-0" />
              {label}
              {tag && <span className="rounded-full bg-gold px-1.5 py-px text-[10px] font-medium tracking-[0.06em] text-white">{tag}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNav({ signedIn, footer }: { signedIn: boolean; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Logo href={signedIn ? "/dashboard" : "/"} size={30} />
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-ink hover:bg-surface-2" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <IX /> : <IMenu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line px-3 pb-4 pt-2" aria-label="Main">
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-3 border-t border-line pt-3">{footer}</div>
        </nav>
      )}
    </div>
  );
}
