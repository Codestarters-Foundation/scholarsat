"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { LinkButton } from "./ui";
import { IGithub } from "./icons";

const CODESTARTERS = "https://codestarters.org";

/**
 * Top bar for the landing page. Full width with a hairline at the top of the page; once you scroll
 * it narrows into a floating, rounded frosted-glass bar (fixed, so the page never reflows).
 */
export function LandingNav({ signedIn, repo }: { signedIn: boolean; repo: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      // Two thresholds so it doesn't flicker when you stop right on the edge.
      setScrolled((was) => (was ? y > 8 : y > 32));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className={`border backdrop-blur-xl backdrop-saturate-150 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          scrolled
            ? "mt-3 rounded-full border-white/70 bg-white/55 py-2 shadow-[0_8px_32px_rgb(38_37_30/0.12),0_1px_0_rgb(255_255_255/0.9)_inset]"
            : "mt-0 rounded-none border-transparent border-b-line bg-white py-3 shadow-none"
        }`}
        style={{
          marginInline: scrolled ? "max(12px, calc((100% - 1060px) / 2))" : "0px",
          paddingInline: scrolled ? "20px" : "max(20px, calc((100% - 1120px) / 2))",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size={34} />
            <a
              href={CODESTARTERS}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CodeStarters"
              className="hidden items-center gap-2 border-l border-line pl-4 text-[13px] font-medium text-ink hover:text-red sm:flex"
            >
              <Image src="/codestarters-logo.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="hidden xl:inline">
                <span className="text-muted">by </span>CodeStarters
              </span>
            </a>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted lg:flex" aria-label="Site">
            <a href="#bank" className="hover:text-ink">Question bank</a>
            <a href="#tests" className="hover:text-ink">Mock tests</a>
            <a href="#tools" className="hover:text-ink">Tools</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
            <a href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink"><IGithub className="h-4 w-4" /> GitHub</a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <LinkButton href="/dashboard" size="sm">Open dashboard</LinkButton>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-ink sm:inline-block">Log in</Link>
                <LinkButton href="/signup" size="sm">Create free account</LinkButton>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
