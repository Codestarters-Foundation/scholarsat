// Run against the local build with Playwright on NODE_PATH and Chrome installed.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS runner resolves Playwright from NODE_PATH. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const url = process.env.PREVIEW_URL ?? "http://127.0.0.1:3822/";
async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function verify() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const [width, height, reducedMotion] of [
      [1512, 862, "no-preference"], [1920, 1200, "no-preference"], [390, 844, "no-preference"], [320, 650, "reduce"],
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        document.addEventListener("animationstart", event => {
          if (event.animationName === "word-arrive") {
            const arrival = event.target.getAnimations().find(animation => animation.animationName === "word-arrive").effect;
            window.wordArrival = arrival.getTiming().duration;
            window.wordStartsHidden = Number(arrival.getKeyframes()[0].opacity) === 0;
          }
          if (event.animationName !== "word-flight") return;
          const effect = event.target.getAnimations().find(animation => animation.animationName === "word-flight")?.effect;
          if (effect) window.openingHold = effect.getTiming().duration * effect.getKeyframes()[1].offset;
        });
      });
      await page.goto(url, {waitUntil:"domcontentloaded"});
      await page.locator(".atlas[data-motion]").waitFor();
      if (reducedMotion !== "reduce") {
        await page.waitForFunction(() => typeof window.openingHold === "number");
        const hold = await page.evaluate(() => window.openingHold - window.wordArrival);
        assert.ok(await page.evaluate(() => window.wordStartsHidden && window.wordArrival > 0));
        assert.ok(hold >= 1300, "The centered wordmark needs a readable hold");
      }
      await page.evaluate(() => Promise.all([document.fonts.ready, ...Array.from(document.querySelectorAll(".atlas img"), image => image.decode())]));
      assert.match(await page.getByRole("heading", { level: 1 }).innerText(), /^ScholarSAT$/);
      assert.equal(await page.getByText("From the question bank", {exact: false}).count(), 0);
      assert.ok((await page.locator("#passage-title").evaluate(el => getComputedStyle(el).fontFamily)).includes("Mona Sans"));
      assert.equal(await page.locator(".cover-copy").getByText(/Free SAT practice/i).count(), 0);
      assert.equal(await page.getByText("Rehearse the full test.").count(),0);
      assert.equal(await page.getByText(/Start with a missing word/).count(),0);
      assert.equal(await page.getByText(/Several ancient cultures developed calendars/).count(),1);
      const headerNav = page.getByRole("navigation", {name:width < 1024 ? "Mobile navigation" : "Main navigation"});
      if (width < 1024) await page.getByLabel("Navigation menu").click();
      assert.deepEqual(await headerNav.getByRole("link").allTextContents(), ["Practice", "AI tutor", "Mock tests", "Tools", "FAQ", " GitHub", ...(width < 1024 ? ["Log in"] : [])]);
      assert.equal(await headerNav.getByRole("link", {name:"Practice"}).getAttribute("href"), "/practice");
      if (width < 1024) await page.keyboard.press("Escape");
      const plate = page.locator(".exposure-origin figure").last();
      const transform = () => plate.evaluate(el => getComputedStyle(el).transform);
      const before = await transform();
      const scrub = page.getByRole("slider", {name:"Explore ten nights"});
      const reading = page.locator(".phase-readout");
      const initial = await reading.innerText();
      assert.match(initial, /03 Jan.*14\.6% lit/i);
      const sprite = page.locator(".lunar-frame").first();
      const firstTile = await sprite.evaluate(el => getComputedStyle(el).backgroundPosition);
      await page.evaluate(() => scrollTo(0, innerHeight * .5));
      await settle(page);
      assert.equal((await reading.innerText()) === initial, reducedMotion === "reduce");
      assert.equal((await sprite.evaluate(el => getComputedStyle(el).backgroundPosition)) === firstTile, reducedMotion === "reduce");
      if (reducedMotion !== "reduce") {
        for (const fraction of [.15, .5, .85]) {
          await page.evaluate(fraction => {
            const cover = document.querySelector(".atlas-cover").getBoundingClientRect();
            const stage = document.querySelector(".atlas-stage").getBoundingClientRect();
            const header = document.querySelector(".landing-header").getBoundingClientRect();
            scrollTo(0, scrollY + cover.top - header.height + (cover.height - stage.height) * fraction);
          }, fraction);
          await settle(page);
          const stage = await page.locator(".atlas-stage").boundingBox();
          const header = await page.locator(".landing-header").boundingBox();
          assert.ok(Math.abs(header.y) < 2 && Math.abs(stage.y - header.height) < 2 && stage.y + stage.height >= height - 1, "The header and pinned lunar scene must fill the viewport");
        }
        await page.evaluate(() => {
          const cover = document.querySelector(".atlas-cover").getBoundingClientRect();
          const stage = document.querySelector(".atlas-stage").getBoundingClientRect();
          scrollTo(0, scrollY + cover.bottom - stage.height * .5);
        });
        await settle(page);
        assert.notEqual(await transform(), before);
      }
      await page.evaluate(() => scrollTo(0,0));
      await settle(page);
      assert.equal(await transform(), before);
      assert.equal(await reading.innerText(), initial);
      await scrub.focus();
      await page.keyboard.press("End");
      await settle(page);
      assert.match(await reading.innerText(), /13 Jan.*99\.6% lit/i);
      await page.keyboard.press("Home");
      await settle(page);
      assert.equal(await reading.innerText(), initial);

      await page.getByRole("link", { name: "Try reading & writing" }).click();
      await page.waitForURL("**/#passage");
      await page.waitForFunction(() => {
        const section = document.getElementById("passage");
        const zoom = section.getBoundingClientRect().width / parseFloat(getComputedStyle(section).width);
        return Math.abs(section.getBoundingClientRect().top - parseFloat(getComputedStyle(section).scrollMarginTop) * zoom) < 3;
      });
      await settle(page);
      if (reducedMotion !== "reduce") {
        assert.ok(await page.evaluate(() =>
          Array.from(document.querySelectorAll(".exposure-origin figure")).every((frame, i) => {
            const a = frame.getBoundingClientRect(), b = document.querySelectorAll(".archive-slot")[i].getBoundingClientRect();
            return Math.abs(a.x-b.x) < 2 && Math.abs(a.y-b.y) < 2 && Math.abs(a.width-b.width) < 2;
          })), "All four moving frames should land in their own date slots");
      }
      const contrast = page.getByRole("button", {name:"By contrast,"});
      await contrast.focus();
      assert.equal(await page.locator(".insertion").innerText(),"By contrast,");
      await page.keyboard.press("Enter");
      await page.getByText("Try another transition.").waitFor();
      await page.getByRole("button", {name:"For example,"}).click();
      await page.getByText("Exactly.").waitFor();
      assert.equal(await page.locator(".insertion").innerText(),"For example,");
      assert.ok(await page.getByRole("link",{name:"Practice five more transitions"}).isVisible());
      // Jump to the center of each native chapter, then drive a leaf partway and rewind it.
      const folio = page.locator(".folio-stage");
      const chapter = async (id, offset = 0) => {
        await page.locator(id).evaluate((el, offset) => {
          const r = el.getBoundingClientRect();
          scrollTo(0, scrollY + r.top + offset);
        },offset);
        await settle(page);
      };
      await chapter("#book",-height*.5);
      const plateWidth = () => page.locator(".cover-exposure").evaluate(el => el.getBoundingClientRect().width);
      const initialWidth = await plateWidth();
      await chapter("#book",height*.29);
      if (reducedMotion === "reduce") assert.equal(initialWidth, 0);
      else {
        assert.ok(await plateWidth() < initialWidth, "The photograph should contract into the jacket");
        const jacket = await page.locator(".jacket-plate").boundingBox();
        const exposure = await page.locator(".cover-exposure").boundingBox();
        for (const key of ["x","y","width","height"]) assert.ok(Math.abs(jacket[key] - exposure[key]) < 3, "Photographic handoff: " + key);
      }
      await chapter("#bank");
      assert.equal(await folio.getAttribute("data-spread"),"1");
      await page.locator(".jacket-plate").evaluate(image => image.decode());
      await chapter("#bank");
      // The selected page is the actual product surface, including touch hit targets.
      const skill = page.getByLabel("Choose a skill");
      assert.ok(await skill.evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top > 0 && r.bottom < innerHeight &&
          el === document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      }), "The skill picker should be legible and operable on the page");
      const binding = await page.locator(".folio-binding").boundingBox();
      const hand = {x: binding.x + binding.width * .95, y: binding.y + binding.height * .06};
      await page.mouse.move(hand.x,hand.y);
      await page.mouse.down();
      await page.mouse.move(hand.x-binding.width*.46,hand.y,{steps:5});
      await settle(page);
      if (reducedMotion !== "reduce") {
        const angle = await page.locator(".folio-leaf").nth(1).evaluate(el => parseFloat(el.style.getPropertyValue("--angle")));
        assert.ok(angle < -5 && angle > -172,"A held page should follow the hand");
      }
      await page.mouse.move(hand.x,hand.y,{steps:4});
      await page.mouse.up();
      await folio.focus();
      await page.keyboard.press("End");
      await page.waitForFunction(() => document.querySelector(".folio-stage").dataset.spread === "4");
      await page.keyboard.press("Home");
      await page.waitForFunction(() => document.querySelector(".folio-stage").dataset.spread === "0");
      await chapter("#tests");
      assert.equal(await folio.getAttribute("data-spread"),"2");
      const leafAngle = () => page.locator(".folio-leaf").nth(1).evaluate(el => parseFloat(el.style.getPropertyValue("--angle")));
      assert.ok(await leafAngle() < -175);
      if (reducedMotion !== "reduce") {
        const gap = await page.evaluate(() => document.querySelector("#tests").offsetTop-document.querySelector("#bank").offsetTop);
        await chapter("#tests",-gap*.5);
        const angle = await leafAngle();
        assert.ok(angle < -6 && angle > -174, "A partly turned page should stay in the reader's hands");
      }
      await page.getByRole("navigation",{name:"Study options"}).getByRole("link",{name:"Mock tests"}).click();
      await page.waitForURL("**/#tests");
      await page.getByRole("button",{name:"Math · Module 2"}).click();
      assert.match(await page.locator(".module-detail").innerText(),/22 questions · 35 minutes/);
      assert.match(await page.locator(".module-detail h4").innerText(),/Math/);
      assert.equal(await page.locator(".minute-dial strong").innerText(),"35");
      await chapter("#tools");
      assert.equal(await folio.getAttribute("data-spread"),"3");
      assert.match(await page.locator(".answer-imprint").innerText(),/For example,/);
      await page.getByRole("link",{name:"Mistake review"}).waitFor();
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await settle(page);
      assert.equal(await folio.getAttribute("data-spread"),"4");
      const entry = page.getByRole("link",{name:"Start practicing"});
      assert.equal(await entry.getAttribute("href"), "/practice/play?section=rw&limit=5");
      await entry.click();
      await page.waitForURL("**/practice/play?**");
      await page.getByText("Question 1 of 5",{exact:true}).first().waitFor();
      await page.goBack();
      await page.getByRole("navigation",{name:"Study options"}).getByRole("link",{name:"Practice sets"}).click();
      await page.locator(".subject-choices button").last().click();
      await page.getByLabel("Choose a skill").selectOption("Transitions");
      assert.equal(await skill.inputValue(), "Transitions");
      assert.match(await page.locator(".set-start").getAttribute("href"), /section=rw&skill=Transitions&limit=5/);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await chapter("#enter");
      const chosenEntry = page.locator(".endpaper").getByRole("link", {name:"Start my set"});
      assert.equal(await chosenEntry.getAttribute("href"), await page.locator(".set-start").getAttribute("href"));
      assert.match(await page.locator(".endpaper p").innerText(), /Transitions · 5 questions/);
      await chosenEntry.click();
      await page.getByText("Question 1 of 5",{exact:true}).first().waitFor();
      await page.locator(".practice-player fieldset label").first().click();
      await page.getByRole("button",{name:"Check",exact:true}).click();
      await page.locator(".practice-player [role=status]").first().waitFor();
      assert.deepEqual(errors, []);
      console.log(`${width}×${height} · ${reducedMotion} · passage, motion, feedback, mock modules, study tools and graded set passed`);
      await page.close();
    }
    const cinema = await browser.newPage({viewport:{width:390,height:844}, reducedMotion:"reduce"});
    await cinema.addInitScript(() => localStorage.setItem("ss_reduce_motion","true"));
    const full = new URL(url);
    full.searchParams.set("motion","full");
    await cinema.goto(full.href);
    await cinema.locator(".atlas[data-motion=on]").waitFor();
    assert.equal(await cinema.locator(".opening-word").evaluate(el => getComputedStyle(el).animationDuration),"2.45s");
    assert.equal(await cinema.locator(".atlas-stage").evaluate(el => getComputedStyle(el).position),"sticky");
    await cinema.goto(full.href + "#enter");
    await cinema.locator('.folio-stage[data-spread="4"]').waitFor();
    await cinema.getByRole("link",{name:/Start practicing/}).click();
    await cinema.getByText("Question 1 of 5",{exact:true}).first().waitFor();
    console.log("Full-motion visit and direct question-bank entry passed");
    await cinema.close();
  } finally {
    await browser.close();
  }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
