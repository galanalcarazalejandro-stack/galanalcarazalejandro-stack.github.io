import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "../..");
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const url = pathToFileURL(path.join(root, "index.html")).href;
try {
  for (const check of [
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await page.goto(url);
      await page.locator(".album-stage").scrollIntoViewIfNeeded();
      const first = await page.locator(".album-caption").innerText();
      await page.waitForFunction(
        (title) =>
          document.querySelector(".album-caption").textContent !== title,
        first,
        { timeout: 6000 },
      );
      await page.locator(".album-meta").hover();
      const hovered = await page.locator(".album-caption").innerText();
      await page.waitForTimeout(4300);
      assert.equal(
        await page.locator(".album-caption").innerText(),
        hovered,
        "Hover should pause autoplay",
      );
      assert.equal(
        await page.locator(".album-playback, .album-counter").count(),
        0,
      );
      await page.locator(".album-next").focus();
      await page.mouse.move(1, 1);
      await page.waitForTimeout(4300);
      assert.equal(
        await page.locator(".album-caption").innerText(),
        hovered,
        "Keyboard focus should pause autoplay after the pointer leaves",
      );
      await page.locator(".project-category").nth(1).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page
        .locator(".project-category")
        .nth(1)
        .screenshot({
          path: path.join(root, "reports", "screenshots", "project-titles.png"),
        });
      await page.close();
    },
    async () => {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: "reduce",
      });
      await page.goto(url);
      await page.locator(".album-stage").scrollIntoViewIfNeeded();
      assert.equal(
        await page.locator(".album-playback, .album-counter").count(),
        0,
      );
      await page.waitForTimeout(4300);
      assert.equal(
        await page.locator(".album").first().getAttribute("aria-current"),
        "true",
        "Reduced motion should disable autoplay",
      );
      const box = await page.locator(".album-stage").boundingBox();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 255, y: box.y + 90 }],
      });
      await page.waitForTimeout(100);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 160, y: box.y + 90 }],
      });
      await page.waitForTimeout(100);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      assert.equal(
        await page.locator(".album").nth(1).getAttribute("aria-current"),
        "true",
        "Swiping left should advance exactly one album",
      );
      await page.waitForTimeout(350);
      await page.locator(".album-dot").last().tap();
      await page.waitForFunction(
        () =>
          document
            .querySelector(".album-dot:last-child")
            .getAttribute("aria-current") === "true",
      );
      assert.equal(
        await page.locator(".album").last().getAttribute("aria-current"),
        "true",
      );
      await page.close();
    },
  ])
    await check();
  console.log(
    "Album autoplay, hover/focus pause, reduced motion and native touch swipe passed.",
  );
} finally {
  await browser.close();
}
