"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-surface hover:text-red"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
