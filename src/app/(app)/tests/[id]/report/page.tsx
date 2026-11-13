import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTest } from "@/lib/tests";
import { BY_ID, isCorrect } from "@/lib/bank";
import { SECTION_LABEL } from "@/lib/types";
import { Badge, Card, LinkButton, PageTitle, Progress } from "@/components/ui";
import { Owl } from "@/components/Owl";

export const metadata: Metadata = { title: "Score Report" };

export default async function Report({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const t = getTest(user.id, id);
  if (!t) notFound();
  if (!t.finished_at) redirect(`/tests/${id}`);
  const s = t.state;
  const total = (t.score_rw ?? 0) + (t.score_math ?? 0);

  const domainStats: Record<string, { right: number; n: number; section: string }> = {};
  const rows = s.modules.flatMap((m, mi) =>
    m.ids.map((qid, k) => {
      const q = BY_ID.get(qid)!;
      const resp = s.answers[qid] ?? "";
      const ok = !!resp && isCorrect(q, resp);
      const d = (domainStats[q.domain] ??= { right: 0, n: 0, section: q.section });
      d.n++;
      d.right += ok ? 1 : 0;
      return { mi, k, q, resp, ok };
    }),
  );

  return (
    <div className="animate-rise">
      <PageTitle title={`Test #${id} score report`} sub={new Date(t.finished_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} action={<LinkButton href="/tests" variant="secondary">All tests</LinkButton>} />
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="relative grid gap-6 bg-red px-6 py-8 text-white sm:px-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex items-center gap-5">
            <Owl size={88} mood="celebrate" />
            <div>
              <p className="eyebrow text-white/80">Estimated total score</p>
              <p className="text-[64px] leading-none font-medium tracking-tight tabular-nums">{total}</p>
              <p className="mt-1 text-sm text-white/80">400–1600</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:justify-self-end">
            {(["rw", "math"] as const).map((sec) => (
              <div key={sec} className="min-w-[200px] rounded-xl bg-white p-4 text-ink">
                <p className="text-sm text-muted">{SECTION_LABEL[sec]}</p>
                <p className="text-[32px] leading-tight font-medium tabular-nums">{sec === "rw" ? t.score_rw : t.score_math}</p>
                <p className="text-xs text-muted">200–800 · Module 2: <span className="font-medium text-ink">{s.modules[sec === "rw" ? 1 : 3].path === "harder" ? "Harder" : "Easier"}</span></p>
              </div>
            ))}
          </div>
        </div>
        <p className="border-t border-line px-6 py-3 text-xs text-muted sm:px-8">This is an estimate from ScholarSAT questions, not an official College Board score.</p>
      </section>

      <Card className="mt-6">
        <h2 className="text-[17px] font-medium">By domain</h2>
        <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {Object.entries(domainStats).map(([dom, d]) => (
            <div key={dom}>
              <div className="mb-1.5 flex justify-between text-sm"><span>{dom}</span><span className="tabular-nums text-muted">{d.right}/{d.n}</span></div>
              <Progress value={d.right / d.n} tone={d.right / d.n >= 0.7 ? "ok" : d.right / d.n < 0.5 ? "red" : "gold"} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-medium">Answer review</h2>
            <p className="text-sm text-muted">Open any question to see the explanation.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Badge tone="ok">Correct</Badge><Badge tone="bad">Incorrect</Badge><Badge>Omitted</Badge></div>
        </div>
        {[0, 1, 2, 3].map((mi) => (
          <div key={mi} className="mt-6">
            <p className="eyebrow mb-2 text-gold-600">{SECTION_LABEL[mi < 2 ? "rw" : "math"]} · Module {(mi % 2) + 1}</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-14">
              {rows.filter((r) => r.mi === mi).map((r) => (
                <Link key={r.q.id} href={`/practice/play?ids=${r.q.id}&title=${encodeURIComponent(`Test #${id} review`)}`} className={`grid h-10 place-items-center rounded-lg text-sm font-medium tabular-nums transition-transform hover:-translate-y-0.5 ${r.ok ? "bg-ok-50 text-ok" : r.resp ? "bg-bad-50 text-bad" : "bg-surface-2 text-muted"}`} title={`${r.q.skill}: ${r.ok ? "correct" : r.resp ? "incorrect" : "omitted"}`}>
                  {r.k + 1}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
