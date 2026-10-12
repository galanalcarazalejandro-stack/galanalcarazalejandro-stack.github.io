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
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.waitForTimeout(1600);
  assert.equal(
    await page
      .getByRole("link", { name: "rodrygodesign" })
      .getAttribute("href"),
    "https://rodrygodesign.github.io/rodrygodesign/index.html",
  );
  assert.notEqual(
    await page
      .locator(".site-header")
      .evaluate((header) => getComputedStyle(header).backdropFilter),
    "none",
  );
  await page.mouse.move(300, 300);
  await page.waitForTimeout(500);
  await page.mouse.move(900, 400);
  await page.waitForTimeout(50);
  assert.ok(
    await page
      .locator(".cursor-layer")
      .evaluate(
        (layer) =>
          layer.matches(":popover-open") &&
          layer.classList.contains("is-visible"),
      ),
  );
  const trailDistance = await page.evaluate(() => {
    const ring = document.querySelector(".cursor-ring").getBoundingClientRect();
    const tail = [...document.querySelectorAll(".cursor-trail")]
      .at(-1)
      .getBoundingClientRect();
    return Math.abs(ring.x - tail.x);
  });
  assert.ok(trailDistance > 5, "The trail should follow behind the pointer");
  await page.waitForTimeout(550);
  assert.ok(
    await page
      .locator(".cursor-trail")
      .evaluateAll((dots) =>
        dots.every((dot) => Number(getComputedStyle(dot).opacity) === 0),
      ),
    "The trail should fade when the pointer stops",
  );
  await page.getByRole("button", { name: "Abrir menú" }).hover();
  await page.waitForFunction(
    () =>
      parseFloat(
        getComputedStyle(document.querySelector(".cursor-ring")).width,
      ) >= 43,
  );
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.waitForTimeout(750);
  await page.getByRole("button", { name: "Cerrar menú" }).hover();
  assert.ok(
    await page
      .locator(".cursor-layer")
      .evaluate(
        (layer) =>
          layer.matches(":popover-open") &&
          layer.classList.contains("is-visible"),
      ),
    "Cursor must remain visible over the modal",
  );
  await page.keyboard.press("Escape");
  await page.locator("#site-menu").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Abrir archivo fotográfico" }).click();
  await page.waitForTimeout(750);
  await page.getByRole("button", { name: "Fotografía siguiente" }).click();
  assert.equal(await page.locator(".carousel-count").innerText(), "02 / 04");
  await page.getByRole("button", { name: "Cerrar proyecto" }).click();
  await page.locator("#project-dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Abrir proyecto ICE" }).click();
  await page.locator("#dialog-media video").hover();
  assert.equal(
    await page
      .locator("html")
      .evaluate((html) => html.classList.contains("has-custom-cursor")),
    false,
    "Native video controls should retain the native pointer",
  );
  await page.getByRole("button", { name: "Cerrar proyecto" }).click();
  await page.locator("#project-dialog").waitFor({ state: "hidden" });
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator("html")
      .evaluate((html) => html.classList.contains("has-custom-cursor")),
    false,
    "Keyboard navigation should restore the native pointer",
  );
  assert.deepEqual(errors, []);
  await page.close();

  for (const options of [
    { reducedMotion: "reduce" },
    { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  ]) {
    const nativePage = await browser.newPage(options);
    await nativePage.goto(url);
    await nativePage.mouse.move(180, 240);
    assert.equal(
      await nativePage
        .locator("html")
        .evaluate((html) => html.classList.contains("has-custom-cursor")),
      false,
    );
    assert.equal(
      await nativePage
        .locator(".cursor-layer")
        .evaluate((layer) => layer.matches(":popover-open")),
      false,
    );
    await nativePage.close();
  }
  console.log(
    "Glass surfaces, footer credit, cursor trail, modal interactions, keyboard, touch and reduced motion passed.",
  );
} finally {
  await browser.close();
}
