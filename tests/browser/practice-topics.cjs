// Run against the built local preview with Playwright on NODE_PATH.
const verify = async () => {
  const assert = await import("node:assert/strict");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Playwright is installed outside this repo.
  const { chromium } = require("playwright");
  const origin = process.env.PREVIEW_URL || "http://127.0.0.1:3187";
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ baseURL: origin });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/practice");
    await page.getByRole("heading", { name: "Algebra", exact: true }).waitFor();
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").innerText(), "Skip to practice");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(":focus").getAttribute("id"), "practice-skills");
    for (const [width, height] of [[320, 640], [390, 844], [1280, 800], [2560, 1440], [3440, 1440]]) {
      await page.setViewportSize({ width, height });
      await page.goto("/practice");
      for (const section of ["Math", "Reading and Writing"]) {
        await page.getByRole("navigation", {name:"Practice subject"}).getByRole("link", {name:new RegExp(section)}).click();
        await page.getByRole("navigation", {name:"Practice subject"}).locator('a[aria-current="page"]').filter({hasText:section}).waitFor();
        await page.getByRole("heading", {name:section === "Math" ? "Algebra" : "Information and Ideas",exact:true}).waitFor();
        const topics = page.getByRole("navigation", {name:"Topics"});
        const links = topics.locator("a:not(.new-set)");
        assert.equal(await links.count(), 4);
        for (const link of await links.all()) {
          const label = await link.innerText();
          await link.click();
          await page.getByRole("heading", { name: label.trim(), exact: true }).waitFor();
          assert.ok(await page.locator("button.skill-start").count() > 0);
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), String(width));
      assert.equal(await page.getByRole("link", {name:"Resources",exact:true}).count(), 0);
    }
    await page.locator(".skill-select").first().click();
    await page.getByRole("button", {name:"Practice selected"}).click();
    await page.locator(".practice-player .tutor summary").waitFor();
    await page.getByRole("link", {name:"Exit practice"}).click();
    await page.getByRole("heading", {name:"Standard English Conventions",exact:true}).waitFor();
    await page.getByRole("link", {name:"Practice 46 new questions"}).click();
    await page.getByText("Question 1 of 46", {exact:true}).waitFor();
    await page.goto("/tutor?section=math");
    const tutor = page.locator(".guided-margin .tutor");
    await tutor.getByLabel("Connection").selectOption("key");
    assert.ok(await tutor.getByRole("button", {name:"Give me a hint"}).isDisabled());
    await tutor.getByLabel("Connection").selectOption("provider");
    await tutor.getByRole("button", {name:/set up free AI/i}).click();
    await tutor.getByText("Google Gemini", {exact:true}).first().waitFor();
    await tutor.getByLabel("Connection").selectOption("plan");
    await tutor.getByRole("button", {name:"Continue with ChatGPT"}).waitFor();
    await page.reload();
    assert.equal(await tutor.getByLabel("Connection").inputValue(), "plan");
    await page.getByLabel("Your answer").fill("8");
    await page.getByRole("button", {name:"Check answer"}).click();
    await page.getByText("Correct", {exact:true}).waitFor();
    await tutor.getByRole("button", {name:"Explain this answer"}).waitFor();
    await page.getByRole("link", {name:"Practice this skill"}).click();
    await page.getByText("Question 1 of 5", {exact:true}).waitFor();
    assert.deepEqual(errors, []);
    console.log("Subject, topic, skill, curated sets, AI connections and grading passed at five sizes");
  } finally { await browser.close(); }
};
verify().catch(error => { console.error(error); process.exitCode = 1; });
