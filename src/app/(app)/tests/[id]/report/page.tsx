import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTest } from "@/lib/tests";
import { BY_ID, isCorrect } from "@/lib/bank";
import { SECTION_LABEL } from "@/lib/types";
import { Badge, Card, LinkButton, PageTitle, Progress } from "@/components/ui";

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
    <>
      <PageTitle title={`Test #${id} score report`} sub={new Date(t.finished_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} action={<LinkButton href="/tests" variant="secondary">All tests</LinkButton>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-100 bg-gradient-to-br from-white to-red-50 md:col-span-1">
          <p className="text-sm text-muted">Estimated total score</p>
          <p className="font-display text-6xl font-semibold text-red">{total}</p>
          <p className="mt-1 text-xs text-muted">400–1600 scale. This is an estimate from ScholarSAT questions, not an official College Board score.</p>
        </Card>
        {(["rw", "math"] as const).map((sec) => (
          <Card key={sec}>
            <p className="text-sm text-muted">{SECTION_LABEL[sec]}</p>
            <p className="font-display text-4xl font-semibold">{sec === "rw" ? t.score_rw : t.score_math}</p>
            <p className="mt-1 text-xs text-muted">Module 2 path: <span className="font-semibold">{s.modules[sec === "rw" ? 1 : 3].path === "harder" ? "Harder" : "Easier"}</span></p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-xl font-semibold">By domain</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(domainStats).map(([dom, d]) => (
            <div key={dom}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{dom}</span><span className="tabular-nums text-muted">{d.right}/{d.n}</span></div>
              <Progress value={d.right / d.n} tone={d.right / d.n >= 0.7 ? "ok" : d.right / d.n < 0.5 ? "red" : "gold"} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-display text-xl font-semibold">Answer review</h2>
        <p className="text-sm text-muted">Open any question to see the explanation.</p>
        {[0, 1, 2, 3].map((mi) => (
          <div key={mi} className="mt-5">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-600">{SECTION_LABEL[mi < 2 ? "rw" : "math"]} · Module {(mi % 2) + 1}</h3>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-14">
              {rows.filter((r) => r.mi === mi).map((r) => (
                <Link key={r.q.id} href={`/practice/play?ids=${r.q.id}&title=${encodeURIComponent(`Test #${id} review`)}`} className={`grid h-10 place-items-center rounded-lg border text-sm font-semibold ${r.ok ? "border-ok/30 bg-ok-50 text-ok" : r.resp ? "border-bad/30 bg-bad-50 text-bad" : "border-line bg-surface text-muted"}`} title={`${r.q.skill}: ${r.ok ? "correct" : r.resp ? "incorrect" : "omitted"}`}>
                  {r.k + 1}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Badge tone="ok">Correct</Badge><Badge tone="bad">Incorrect</Badge><Badge>Omitted</Badge>
        </div>
      </Card>
    </>
  );
}
