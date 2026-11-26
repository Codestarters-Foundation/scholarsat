// Run after npm run build. Uses an isolated database and synthetic provider credentials.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

test("local AI sign-in, browser isolation, consent failure, BYOK and completed inference", async () => {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const origin = "http://127.0.0.1:" + port;
  const data = await mkdtemp(join(tmpdir(), "scholarsat-study-"));
  const server = spawn(
    process.execPath,
    [
      "--import",
      "./tests/fixtures/study-provider.mjs",
      "node_modules/next/dist/bin/next",
      "start",
      "-H",
      "127.0.0.1",
      "-p",
      String(port),
    ],
    {
      env: { ...process.env, DATA_DIR: data, SITE_URL: origin },
      stdio: "ignore",
    },
  );
  const exited = once(server, "exit");
  try {
    for (let i = 0; i < 100; i++) {
      if (
        await fetch(origin + "/api/health")
          .then((r) => r.ok)
          .catch(() => false)
      )
        break;
      await delay(100);
    }
    async function start() {
      const r = await fetch(origin + "/api/study/connect", {
        method: "POST",
        headers: { origin },
        redirect: "manual",
      });
      assert.equal(r.status, 303);
      const params = new URL(r.headers.get("location")).searchParams;
      assert.equal(params.get("redirect_uri"), origin + "/auth/callback");
      return { params, cookie: r.headers.getSetCookie()[0].split(";")[0] };
    }
    const one = await start();
    const callback = (s, state, code) =>
      fetch(
        origin +
          "/auth/callback?" +
          new URLSearchParams({ state, code, client_id: "oaiapp_fixture" }),
        { headers: { cookie: s.cookie } },
      );
    const code =
      one.params.get("nonce") + "." + one.params.get("code_challenge");
    assert.equal((await callback(one, "wrong", code)).status, 400);
    assert.equal(
      (await callback(one, one.params.get("state"), code)).status,
      200,
    );
    assert.equal(
      (await callback(one, one.params.get("state"), code)).status,
      400,
    );
    const lesson = await fetch(origin+"/api/study/tutor", { method:"POST",
      headers:{origin,cookie:one.cookie,"Content-Type":"application/json"},
      body:JSON.stringify({item:"m56bc0dd7", mode:"plan",task:"lesson",response:"8",followup:"Explain this step"}) });
    assert.equal(lesson.status,200);
    assert.match(JSON.parse((await lesson.json()).explanation).steps[0].say,/constant/);
    const denied = await start();
    assert.equal(
      (
        await fetch(
          origin +
            "/auth/callback?error=access_denied&state=" +
            denied.params.get("state"),
          { headers: { cookie: denied.cookie } },
        )
      ).status,
      400,
    );
    const tutor = (mode, cookie = "", key = "") =>
      fetch(origin + "/api/study/tutor", {
        method: "POST",
        headers: { origin, cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ item: "word:provisional", mode, key }),
      });
    assert.equal((await tutor("plan")).status, 401);
    assert.deepEqual(await (await tutor("plan", one.cookie)).json(), {
      explanation: "Fixture explanation.",
    });
    assert.deepEqual(await (await tutor("key", "", "test-key")).json(), {
      explanation: "Fixture explanation.",
    });
    assert.equal((await tutor("key", "", "invalid")).status, 400);
    await fetch(origin + "/api/study/connect", {
      method: "DELETE",
      headers: { origin, cookie: one.cookie },
    });
    assert.equal((await tutor("plan", one.cookie)).status, 401);
  } finally {
    server.kill();
    await exited;
    await rm(data, { recursive: true, force: true });
  }
});
