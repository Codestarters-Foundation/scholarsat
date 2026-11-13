"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";
import { IArrowR } from "./icons";

export function StartTestButton({ label = "Start a new test", size = "lg", className = "", variant = "primary" }: { label?: string; size?: "sm" | "md" | "lg"; className?: string; variant?: "primary" | "secondary" | "dark" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await fetch("/api/tests", { method: "POST" }).then((x) => x.json());
        if (r.id) router.push(`/tests/${r.id}`);
        else setBusy(false);
      }}
    >
      {busy ? "Preparing…" : <>{label} <IArrowR className="h-4 w-4" /></>}
    </Button>
  );
}
