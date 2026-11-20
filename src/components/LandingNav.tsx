"use client";

import Image from "next/image";
import Link from "next/link";
import { Logo } from "./Logo";
import { IGithub } from "./icons";
import { LinkButton } from "./ui";
import { questionBankSession } from "./landing-navigation";

export function LandingNav({ signedIn, repo }: { signedIn: boolean; repo: string }) {
  const links = <>
    <Link href={questionBankSession}>Question bank</Link>
    <a href="#tests">Mock tests</a>
    <a href="#tools">Tools</a>
    <a href="#faq">FAQ</a>
    <a href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5"><IGithub className="h-4 w-4" /> GitHub</a>
  </>;

  return (
    <header className="landing-header sticky inset-x-0 top-0 z-40 border-b border-line bg-bg font-sans text-ink">
      <div className="mx-auto flex h-full max-w-[1160px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-5">
        <div className="flex items-center gap-4">
          <Logo size={34} />
          <a href="https://codestarters.org" target="_blank" rel="noopener noreferrer" aria-label="CodeStarters"
            className="hidden items-center gap-2 border-l border-line pl-4 text-[13px] font-medium sm:flex">
            <Image unoptimized src="/codestarters-logo.png" alt="" width={24} height={24} />
            <span className="hidden xl:inline"><span className="text-muted">by </span>CodeStarters</span>
          </a>
        </div>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm text-muted lg:flex">{links}</nav>
        <div className="flex items-center gap-2">
          {!signedIn && <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-muted lg:inline-block">Log in</Link>}
          <LinkButton href={signedIn ? "/dashboard" : "/signup"} size="sm">
            {signedIn ? "Open dashboard" : <><span className="hidden sm:inline">Create free account</span><span className="sm:hidden">Sign up</span></>}
          </LinkButton>
          <details className="landing-menu relative lg:hidden"
            onClick={event => { if ((event.target as Element).closest("a")) event.currentTarget.open = false; }}
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}
            onKeyDown={event => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}>
            <summary aria-label="Navigation menu" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg">
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h16M3 11h16M3 16h16" /></svg>
            </summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-full grid w-48 rounded-xl border border-line bg-bg p-2 text-sm shadow-pop">
              {links}
              {!signedIn && <Link href="/login">Log in</Link>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
