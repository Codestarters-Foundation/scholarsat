import Link from "next/link";
import { Logo } from "./Logo";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-line"><div className="mx-auto max-w-3xl px-4 py-4 sm:px-6"><Logo size={30} /></div></header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <div className="mt-8 grid gap-4 leading-relaxed text-ink [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-muted">{children}</div>
        <Link href="/" className="mt-10 inline-block text-sm font-semibold text-red hover:underline">← Back to ScholarSAT</Link>
      </main>
    </div>
  );
}
