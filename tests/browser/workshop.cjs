// Run against a production preview configured with a disposable DATA_DIR and the study-provider fixture.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Headless browser lives in the shared browser cache.
const { chromium } = require("playwright");

async function run() {
  const assert = await import("node:assert/strict");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const baseURL = process.env.WORKSHOP_TEST_URL;
  if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)) throw new Error("Set WORKSHOP_TEST_URL to the isolated local fixture server.");
  const browser = await chromium.launch({channel:"chrome",headless:true});
  const ctx = await browser.newContext({baseURL});
  const page = await ctx.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try {
    const user = {name:"Practice Reviewer",email:`study-${Date.now()}@example.invalid`,password:"isolated-practice-preview"};
    assert.equal((await ctx.request.post("/api/auth/signup",{data:user})).status(),200);
    assert.equal((await ctx.request.post("/api/onboarding",{data:{skip:true}})).status(),200);
    for(const width of [320,1280]) {
      await page.setViewportSize({width,height:850});
      for(const route of ["/dashboard","/practice","/tutor","/tests","/review","/diagnostics","/vocab","/settings"]) {
        await page.goto(route);
        assert.equal(new URL(page.url()).pathname,route);
        await page.getByRole("heading",{level:1}).first().waitFor();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+" "+route);
      }
    }
    // Work through one new question in every skill, using the same public API as the player.
    const fresh=JSON.parse(fs.readFileSync(path.join(__dirname,"../../src/data/questions.json"),"utf8")).filter(q=>q.collection==="skill-workshop");
    const bySkill=new Map(fresh.map(q=>[q.skill,q]));
    assert.equal(bySkill.size,29);
    for(const q of bySkill.values()) {
      const out=await (await ctx.request.get("/api/q/"+q.id)).json();
      assert.equal(out.question.id,q.id);
      assert.equal(out.question.answer,undefined);
      const graded=await (await ctx.request.post("/api/attempt",{data:{id:q.id,response:q.answer,timeMs:1000}})).json();
      assert.equal(graded.correct,true,q.id);
      assert.equal(graded.saved,true,q.id);
    }
    // Issue and complete synthetic PKCE consent for the same browser session.
    const start=await ctx.request.post("/api/study/connect",{headers:{origin:baseURL},maxRedirects:0});
    assert.equal(start.status(),303);
    const auth=new URL(start.headers().location).searchParams;
    const callback="/auth/callback?"+new URLSearchParams({state:auth.get("state"),code:auth.get("nonce")+"."+auth.get("code_challenge"),client_id:"oaiapp_fixture"});
    await page.goto(callback); await page.getByRole("heading",{name:"Your ChatGPT plan is connected"}).waitFor();
    await page.getByRole("link",{name:/Open the AI tutor/}).click();
    await page.getByText("Connected",{exact:true}).waitFor();
    // Annotated lessons must honor the same plan, without asking the learner for a separate provider key.
    let lessonRequests = 0;
    page.on("request", request => {
      if (request.url().endsWith("/api/study/tutor") && request.postDataJSON()?.task === "lesson") lessonRequests++;
    });
    await page.goto("/practice/play?ids=m56bc0dd7,r5f0e707a");
    await page.locator(".study-tutor summary").click();
    await page.getByLabel("Connection",{exact:true}).selectOption("plan");
    let releaseGrade;
    const gradeGate = new Promise(resolve => { releaseGrade = resolve; });
    await page.route("**/api/attempt", async route => {
      await gradeGate;
      await route.continue();
    });
    await page.getByLabel("Your answer").fill("8");
    await page.getByRole("button",{name:"Check",exact:true}).click();
    await page.getByRole("button",{name:"Checking…"}).waitFor();
    assert.equal(await page.getByLabel("Your answer").isDisabled(),true);
    releaseGrade();
    await page.getByRole("button",{name:"Annotated AI lesson"}).click();
    await page.getByText("Check the constant term first.").waitFor();
    await page.locator("footer").getByRole("button",{name:"Next",exact:true}).click();
    await page.getByText("Question 2 of 2",{exact:true}).waitFor();
    await page.locator("footer").getByRole("button",{name:"Back",exact:true}).click();
    await page.getByRole("button",{name:"Annotated AI lesson"}).waitFor();
    assert.equal(await page.getByRole("region",{name:"Tutor",exact:true}).count(),0);
    assert.equal(lessonRequests,1);
    await page.goto("/tutor?connection=plan");
    await page.getByRole("button",{name:"Disconnect ChatGPT"}).click();
    await page.getByRole("button",{name:"Continue with ChatGPT"}).waitFor();
    assert.deepEqual(errors,[]);
    console.log("All 29 skills graded; 8 signed-in screens at 2 widths; plan callback, annotation and disconnect passed.");
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
