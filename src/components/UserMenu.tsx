"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./ui";
import { IChevD, IGear, ILogout } from "./icons";

export function UserMenu({ name, email, answered }: { name: string; email: string; answered: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const level = Math.floor(answered / 25);
  const toNext = (answered % 25) / 25;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2">
        <Avatar name={name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{name}</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            Level {level}
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-gold" style={{ width: `${toNext * 100}%` }} /></span>
          </span>
        </span>
        <IChevD className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-pop">
          <p className="truncate px-3 py-2 text-xs text-muted">{email}</p>
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-2">
            <IGear className="h-4 w-4" /> Settings
          </Link>
          <button
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-red-50 hover:text-red"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            <ILogout className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
