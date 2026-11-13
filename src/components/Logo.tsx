import Link from "next/link";
import { Owl, type OwlMood } from "./Owl";

export function Logo({ href = "/", size = 36, wordmark = true, light = false, mood = "idle" }: { href?: string; size?: number; wordmark?: boolean; light?: boolean; mood?: OwlMood }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 rounded-lg" aria-label="ScholarSAT home">
      <Owl size={size} mood={mood} />
      {wordmark && (
        <span className={`font-medium tracking-[-0.02em] ${light ? "text-white" : "text-ink"}`} style={{ fontSize: Math.round(size * 0.62) }}>
          Scholar<span className={light ? "text-gold-100" : "text-red"}>SAT</span>
        </span>
      )}
    </Link>
  );
}
