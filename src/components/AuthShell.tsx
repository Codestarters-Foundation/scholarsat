"use client";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Owl } from "./Owl";
import { IFireSolid } from "./icons";

const ShyContext = createContext<(v: boolean) => void>(() => {});
/** Lets the form tell the mascot to cover its eyes while a password is being typed. */
export const useOwlShy = () => useContext(ShyContext);

export function AuthShell({ children }: { children: ReactNode }) {
  const [shy, setShy] = useState(false);

  return (
    <ShyContext.Provider value={setShy}>
      <div className="grid min-h-dvh bg-white lg:grid-cols-2">
        {/* Brand panel */}
        <aside className="group relative hidden overflow-hidden bg-red text-white lg:flex lg:flex-col">
          <div className="pattern-grid pointer-events-none absolute inset-0 text-white opacity-[0.045]" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-red-600/60" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-52 -right-40 h-[620px] w-[620px] rounded-full bg-gold/25" aria-hidden="true" />

          <div className="relative px-12 pt-9">
            <Logo size={42} light />
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-12">
            {/* Mascot stage */}
            <div className="relative grid h-[340px] w-[340px] place-items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} className="absolute inset-0 rounded-full border border-white/30" style={{ animation: `ring-out 4.5s ease-out ${i * 1.5}s infinite` }} aria-hidden="true" />
              ))}
              <div className="grid h-[300px] w-[300px] place-items-center rounded-full bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]">
                <Owl size={230} shy={shy} />
              </div>

              {/* Floating cards */}
              <div className="float-a absolute -left-28 top-40 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-ink shadow-pop">
                <IFireSolid className="h-7 w-7" />
                <div>
                  <p className="text-[18px] leading-none font-medium tabular-nums">12</p>
                  <p className="mt-0.5 text-xs text-muted">day streak</p>
                </div>
              </div>
              <div className="float-b absolute -right-32 top-4 rounded-2xl bg-white px-4 py-3 text-ink shadow-pop">
                <p className="text-xs text-muted">Predicted score</p>
                <p className="text-[26px] leading-tight font-medium text-red tabular-nums">1380</p>
                <div className="mt-1 flex h-5 items-end gap-[3px]">
                  {[30, 45, 40, 60, 55, 72, 90].map((h, i) => <span key={i} className="w-2.5 rounded-sm bg-gold" style={{ height: `${h}%` }} />)}
                </div>
              </div>
              <div className="float-c absolute -bottom-14 -right-24 w-[230px] rounded-2xl bg-white p-3.5 text-ink shadow-pop">
                <p className="eyebrow text-muted">Math · Algebra</p>
                <p className="mt-1.5 text-[13px]">If 3x = 54, what is x?</p>
                <div className="mt-2.5 grid gap-1.5 text-[13px]">
                  {["12", "18"].map((a, i) => (
                    <div key={a} className="flex items-center gap-2 rounded-lg border-2 border-line-strong px-2.5 py-1.5" style={i === 1 ? { animation: "pick 7s ease-in-out infinite" } : undefined}>
                      <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-ink text-[11px] font-medium" style={i === 1 ? { animation: "pick-dot 7s ease-in-out infinite" } : undefined}>{"AB"[i]}</span>
                      <span className="tabular-nums">{a}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs font-medium text-ok" style={{ animation: "explain-in 7s ease-in-out infinite" }}>Correct! 54 ÷ 3 = 18.</p>
              </div>
            </div>
          </div>

          <div className="relative px-12 pb-12">
            <h2 className="max-w-lg text-[34px] leading-[1.12] font-medium tracking-[-0.02em]">Practice like it&apos;s test day.<br /><span className="text-gold-100">Pay nothing, ever.</span></h2>
            <dl className="mt-7 grid max-w-lg grid-cols-3 gap-4 border-t border-white/20 pt-6">
              {[["3,200+", "practice questions"], ["98", "question mock tests"], ["$0", "forever"]].map(([n, l]) => (
                <div key={l}>
                  <dt className="text-[24px] leading-none font-medium tabular-nums">{n}</dt>
                  <dd className="mt-1.5 text-[13px] text-white/75">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
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
