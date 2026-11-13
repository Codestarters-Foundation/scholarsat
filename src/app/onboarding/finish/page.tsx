"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { STORAGE_KEY } from "@/lib/onboarding";
import { Owl } from "@/components/Owl";

/** Landing spot after signup/login from a guest onboarding: saves the stored answers, then opens the dashboard. */
export default function Finish() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      let body: unknown = { skip: true };
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) body = JSON.parse(raw);
      } catch {}
      const r = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (r.status === 401) return router.replace("/signup?next=/onboarding/finish");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.replace("/dashboard");
      router.refresh();
    })();
  }, [router]);
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="text-center">
        <Owl size={96} mood="loading" title="Saving your plan" />
        <p className="mt-4 text-sm text-muted">Saving your plan…</p>
      </div>
    </div>
  );
}
