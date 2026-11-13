"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";
import { IArrowR } from "./icons";

export function StartTestButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await fetch("/api/tests", { method: "POST" }).then((x) => x.json());
        if (r.id) router.push(`/tests/${r.id}`);
        else setBusy(false);
      }}
    >
      {busy ? "Preparing your test…" : <>Start a new test <IArrowR className="h-4 w-4" /></>}
    </Button>
  );
}
