import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", size = 36, wordmark = true }: { href?: string; size?: number; wordmark?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg" aria-label="ScholarSAT home">
      <Image src="/logo.png" alt="" width={size} height={size} priority className="shrink-0" />
      {wordmark && (
        <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
          Scholar<span className="text-red">SAT</span>
        </span>
      )}
    </Link>
  );
}
