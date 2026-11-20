"use client";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Owl } from "./Owl";
import Image from "next/image";
import "./scholar-workspace.css";

const ShyContext = createContext<(v: boolean) => void>(() => {});
/** Lets the form tell the mascot to cover its eyes while a password is being typed. */
export const useOwlShy = () => useContext(ShyContext);

export function AuthShell({ children }: { children: ReactNode }) {
  const [shy, setShy] = useState(false);

  return (
    <ShyContext.Provider value={setShy}>
      <div className="grid min-h-dvh bg-bg lg:grid-cols-2">
        <aside className="account-edition">
          <Link href="/" className="account-signature"><Owl size={38} shy={shy} />ScholarSAT</Link>
          <figure>
            <Image src="/landing/lunar/apollo-17-station-6.webp" width={880} height={912} alt="An Apollo 17 astronaut beside a split boulder on the Moon" />
            <figcaption>Apollo 17 · Taurus–Littrow, 1972<br/>Eugene A. Cernan / NASA</figcaption>
          </figure>
        </aside>
        {/* Form side */}
        <div className="flex min-h-dvh flex-col">
          <header className="flex items-center justify-between px-6 py-5 sm:px-10">
            <div className="lg:invisible"><Logo size={36} /></div>
            <Link href="/practice" className="whitespace-nowrap text-sm text-muted transition-colors hover:text-ink"><span className="hidden sm:inline">Try questions without an account</span><span className="sm:hidden">Try it first</span> →</Link>
          </header>
          <main className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
            <div className="w-full max-w-[400px] animate-rise">{children}</div>
          </main>
          <footer className="px-6 pb-6 text-center text-xs text-faint sm:px-10">
            By continuing you agree to the <Link href="/terms" className="underline-offset-2 hover:text-ink hover:underline">Terms</Link> and <Link href="/privacy" className="underline-offset-2 hover:text-ink hover:underline">Privacy Policy</Link>.
          </footer>
        </div>
      </div>
    </ShyContext.Provider>
  );
}
