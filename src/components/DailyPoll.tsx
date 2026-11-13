"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DailyPollData } from "@/lib/daily";
import { SECTION_LABEL, type Section } from "@/lib/types";
import { ICheck, IChevR } from "./icons";
import { SubjectArt } from "./ui";

function useCountdown(resetsAt: number) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const l = resetsAt - Date.now();
      setLeft(Math.max(0, l));
      if (l <= 0) router.refresh();
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [resetsAt, router]);
  if (left === null) return "";
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Dashboard tiles for today's two questions. Each opens the full-screen daily poll. */
export function DailyPoll({ polls }: { polls: Record<Section, DailyPollData> }) {
  const countdown = useCountdown(polls.math.resetsAt);
  const dayNo = polls.math.day - 20400;
  return (
    <div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {(["math", "rw"] as Section[]).map((sec) => {
          const d = polls[sec];
          return (
            <Link
              key={sec}
              href={`/daily/${sec}`}
              className={`group relative flex h-40 flex-col justify-between overflow-hidden rounded-xl p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 ${sec === "math" ? "bg-red-50 text-red" : "bg-gold-50 text-gold-600"}`}
            >
              <SubjectArt kind={sec} className="pointer-events-none absolute -right-6 -top-8 h-56 w-56 transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105" />
              <div className="relative">
                <p className="eyebrow opacity-80">Daily #{dayNo}</p>
                <p className="mt-1 text-[20px] font-medium text-ink">{SECTION_LABEL[sec]}</p>
              </div>
              <div className="relative flex items-end justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  {d.mine !== null && <ICheck className="h-4 w-4 text-ok-500" />}
                  {d.mine !== null ? "Voted" : "Click for more"}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium tabular-nums">
                  {d.total.toLocaleString()} {d.total === 1 ? "vote" : "votes"}
                  <IChevR className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="px-5 pb-3 text-xs text-muted">New questions in <span className="font-medium tabular-nums text-ink">{countdown || "…"}</span></p>
    </div>
  );
}
