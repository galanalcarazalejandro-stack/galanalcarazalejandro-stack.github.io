import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "../..");
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(root, "index.html")).href);
    await page.waitForTimeout(1800);
    const height = await page
      .locator(".hero")
      .evaluate((el) => el.offsetHeight);
    const samples = [];
    for (const progress of [0, 0.15, 0.35, 0.55, 0.85, 1.2]) {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        height * progress,
      );
      await page.waitForTimeout(220);
      const sample = await page.evaluate(() => {
        const hero = document.querySelector(".hero");
        const stage = document.querySelector(".hero-stage");
        const cover = document.querySelector(".vinyl-section");
        const stageBox = stage.getBoundingClientRect();
        const coverBox = cover.getBoundingClientRect();
        const y = Math.max(stageBox.top, coverBox.top) + 10;
        return {
          scale: new DOMMatrix(getComputedStyle(stage).transform).a,
          pinnedTop: hero.getBoundingClientRect().top,
          coverTop: coverBox.top,
          covered: !!document
            .elementFromPoint(innerWidth / 2, y)
            ?.closest(".vinyl-section"),
          visibility: getComputedStyle(stage).visibility,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      if (progress > 0 && progress < 1)
        assert.ok(
          sample.scale < samples.at(-1).scale,
          "Hero should keep shrinking across the scroll",
        );
      assert.ok(
        Math.abs(sample.pinnedTop - (width <= 600 ? 64 : 72)) < 2,
        "Hero should remain pinned behind the following section",
      );
      assert.equal(sample.overflow, false);
      if (progress === 0.55) {
        assert.ok(
          sample.covered,
          "The album section should visibly cover the hero",
        );
        await page.screenshot({
          path: path.join(
            root,
            "reports",
            "screenshots",
            `hero-overlap-${width}.png`,
          ),
        });
      }
      samples.push(sample);
    }
    assert.equal(samples.at(-1).visibility, "hidden");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(250);
    assert.equal(
      await page
        .locator(".hero-stage")
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
      1,
    );
    assert.equal(
      await page
        .locator(".hero-stage")
        .evaluate((el) => getComputedStyle(el).visibility),
      "visible",
    );
    assert.equal(
      await page.locator('[data-project="trama"] img').getAttribute("src"),
      "assets/images/projects/trama-manual/page-13.webp",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForTimeout(100);
    assert.equal(
      await page
        .locator(".hero")
        .evaluate((el) => getComputedStyle(el).position),
      "relative",
    );
    assert.equal(
      await page
        .locator(".hero-stage")
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
      1,
    );
    assert.deepEqual(errors, []);
    console.log(
      width,
      samples.map((sample) => sample.scale),
      "continuous shrink, overlap, reverse and reduced motion passed",
    );
    await page.close();
  }
} finally {
  await browser.close();
}
