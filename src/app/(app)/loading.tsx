import { Owl } from "@/components/Owl";

/** Shown while any app page loads: the owl flaps, and skeleton cards pulse where content will land. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading">
      <div className="mb-8 flex items-center gap-4">
        <Owl size={56} mood="loading" />
        <div className="grid flex-1 gap-2">
          <div className="h-7 w-64 max-w-full animate-pulse rounded-lg bg-surface-2" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-surface-2" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-surface-2" />
            <div className="h-24 animate-pulse rounded-xl bg-surface" />
            <div className="h-24 animate-pulse rounded-xl bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
