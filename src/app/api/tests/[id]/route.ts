import { BY_ID, toPublic } from "@/lib/bank";
import { getUser } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { MODULES, getTest, saveState, submitModule } from "@/lib/tests";

async function load(params: Promise<{ id: string }>) {
  const user = await getUser();
  if (!user) return { error: bad("Not logged in", 401) };
  const id = Number((await params).id);
  const t = getTest(user.id, id);
  if (!t) return { error: bad("Test not found", 404) };
  return { user, id, t };
}

function view(t: NonNullable<ReturnType<typeof getTest>>) {
  const s = t.state;
  const mod = s.modules[s.current];
  const cfg = MODULES[s.current];
  const remainingMs = mod.startedAt ? Math.max(0, mod.startedAt + cfg.minutes * 60_000 - Date.now()) : cfg.minutes * 60_000;
  return {
    finished: !!t.finished_at,
    current: s.current,
    section: cfg.section,
    minutes: cfg.minutes,
    started: !!mod.startedAt,
    remainingMs,
    questions: mod.ids.map((qid) => toPublic(BY_ID.get(qid)!)),
    answers: Object.fromEntries(mod.ids.filter((q) => s.answers[q] !== undefined).map((q) => [q, s.answers[q]])),
    flags: s.flags.filter((f) => mod.ids.includes(f)),
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load(params);
  if ("error" in r) return r.error;
  return json(view(r.t));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load(params);
  if ("error" in r) return r.error;
  if (r.t.finished_at) return bad("Test already finished", 409);
  const body = await req.json().catch(() => ({}));
  const s = r.t.state;
  const mod = s.modules[s.current];
  if (body.action === "start") {
    if (!mod.startedAt) mod.startedAt = Date.now();
    saveState(r.id, s);
  } else if (body.action === "answer") {
    const qid = String(body.qid ?? "");
    if (!mod.ids.includes(qid)) return bad("Question not in current module");
    const v = String(body.value ?? "").slice(0, 20);
    if (v) s.answers[qid] = v;
    else delete s.answers[qid];
    saveState(r.id, s);
  } else if (body.action === "flag") {
    const qid = String(body.qid ?? "");
    s.flags = s.flags.includes(qid) ? s.flags.filter((f) => f !== qid) : [...s.flags, qid];
    saveState(r.id, s);
  } else if (body.action === "submit") {
    submitModule(r.user.id, r.id);
  } else return bad("Unknown action");
  const fresh = (await load(params)) as { t: NonNullable<ReturnType<typeof getTest>> };
  return json(view(fresh.t));
}
