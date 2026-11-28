"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IBook, ICards, IChart, IExam, IHome, ILink, ISparkle, IMenu, IRefresh, IX } from "./icons";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/dashboard", label: "Home", Icon: IHome },
  { href: "/practice", label: "Practice", Icon: IBook },
  { href: "/tutor", label: "AI tutor", Icon: ISparkle },
  { href: "/tests", label: "Practice Tests", Icon: IExam },
  { href: "/review", label: "Review", Icon: IRefresh },
  { href: "/diagnostics", label: "Diagnostics", Icon: IChart },
  { href: "/vocab", label: "Vocab", Icon: ICards },
  { href: "/resources", label: "Resources", Icon: ILink },
];

export function WorkspaceSkipLink() {
  const practice = usePathname() === "/practice";
  return <a className="workspace-skip" href={practice ? "#practice-skills" : "#workspace-content"}>{practice ? "Skip to practice" : "Skip to content"}</a>;
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <ul className="workspace-index">
      {LINKS.map(({ href, label, Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className="workspace-index-link"
            >
              <Icon className="h-[20px] w-[20px] shrink-0" />
              {label}
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
  const trigger = useRef<HTMLButtonElement>(null);
  const current = LINKS.find(link=>path===link.href || path.startsWith(link.href+"/"))?.label;
  useEffect(() => setOpen(false), [path]);
  return (
    <div onKeyDown={e=>{if(open && e.key==="Escape"){ setOpen(false); trigger.current?.focus(); }}} className="workspace-phone sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Logo href={signedIn ? "/dashboard" : "/"} size={30} />
        <button ref={trigger} aria-controls="workspace-mobile-links" onClick={() => setOpen((o) => !o)} className="mobile-nav-trigger rounded-lg p-2 text-ink hover:bg-surface-2" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
          <span className="mobile-current" aria-hidden="true">{current}</span>{open ? <IX /> : <IMenu />}
        </button>
      </div>
      {open && (
        <nav id="workspace-mobile-links" className="border-t border-line px-3 pb-4 pt-2" aria-label="Main">
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-3 border-t border-line pt-3">{footer}</div>
        </nav>
      )}
    </div>
  );
}
