import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "../..");
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const url = pathToFileURL(path.join(root, "index.html")).href;
const results = [];
await fs.mkdir(path.join(root, "reports", "screenshots"), { recursive: true });

for (const [label, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
  ["mobile-small", 320, 720],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(root, "reports", "screenshots", `${label}-top.png`),
  });
  await page.evaluate(() => scrollTo({ top: 90, behavior: "instant" }));
  await page.waitForTimeout(120);
  const morph = await page.evaluate(() => ({
    scale: new DOMMatrix(
      getComputedStyle(document.querySelector(".hero-stage")).transform,
    ).a,
    radius: parseFloat(
      getComputedStyle(document.querySelector(".hero-stage"))
        .borderTopLeftRadius,
    ),
    floatingHeader: document
      .querySelector(".site-header")
      .classList.contains("is-scrolled"),
    heroGap:
      document.querySelector(".vinyl-section").getBoundingClientRect().top -
      document.querySelector(".hero-stage").getBoundingClientRect().bottom,
  }));
  assert.ok(
    morph.scale < 1 && morph.radius === 0,
    `${label}: hero should shrink with square corners`,
  );
  assert.ok(morph.floatingHeader, `${label}: navbar does not change on scroll`);
  assert.ok(
    morph.heroGap <= (width <= 600 ? 85 : 145),
    `${label}: too much space after the hero (${morph.heroGap}px)`,
  );
  await page.screenshot({
    path: path.join(root, "reports", "screenshots", `${label}-hero-window.png`),
  });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  const pageHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  for (let y = 0; y < pageHeight; y += Math.round(height * 0.8)) {
    await page.evaluate(
      (position) => scrollTo({ top: position, behavior: "instant" }),
      y,
    );
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(root, "reports", "screenshots", `${label}-full.png`),
    fullPage: true,
  });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(250);
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    heroImage: document.querySelector(".hero img").naturalWidth,
    heroChildren: document.querySelector(".hero").children.length,
    heroLayers: document.querySelectorAll(".hero-layer").length,
    heroPersonSource: document.querySelector(".hero-person img").currentSrc,
    headerPosition: getComputedStyle(document.querySelector(".site-header"))
      .position,
  }));
  assert.equal(
    layout.document,
    layout.viewport,
    `${label}: horizontal overflow`,
  );
  assert.ok(layout.heroImage > 0, `${label}: hero image missing`);
  assert.equal(layout.heroChildren, 1, `${label}: hero contains extra content`);
  assert.equal(layout.heroLayers, 3, `${label}: hero layers missing`);
  if (width <= 600) {
    assert.match(layout.heroPersonSource, /hero-person-mobile\.webp$/);
    const heroBounds = await page.evaluate(() => {
      const stage = document
        .querySelector(".hero-stage")
        .getBoundingClientRect();
      return [".hero-type img", ".hero-person img"].map((selector) => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return (
          box.left >= stage.left - 1 &&
          box.right <= stage.right + 1 &&
          box.top >= stage.top - 1 &&
          box.bottom <= stage.bottom + 1
        );
      });
    });
    assert.deepEqual(
      heroBounds,
      [true, true],
      `${label}: mobile hero crops a layer`,
    );
  }
  assert.equal(layout.headerPosition, "fixed", `${label}: navbar is not fixed`);
  for (const selector of [".brand img", ".site-footer img"]) {
    const logo = await page.locator(selector).evaluate((image) => ({
      source: image.getAttribute("src"),
      loaded: image.naturalWidth > 0,
      filter: getComputedStyle(image).filter,
    }));
    assert.equal(logo.source, "assets/images/brand/gfx-logo.png");
    assert.ok(logo.loaded, `${label}: ${selector} failed to load`);
    assert.notEqual(
      logo.filter,
      "none",
      `${label}: ${selector} is white on white`,
    );
  }
  assert.ok(
    (await page.locator("#about-title .bounce-char").count()) > 5,
    `${label}: bouncy heading letters missing`,
  );
  assert.equal(
    await page.locator('a[href="https://wa.me/34697782479"]').count(),
    2,
    `${label}: WhatsApp links missing`,
  );
  assert.equal(
    await page
      .locator('a[href^="mailto:galanalcarazalejandro@gmail.com"]')
      .count(),
    2,
    `${label}: email links missing`,
  );
  assert.match(
    await page.locator("#sobre-mi").innerText(),
    /Sobre mí\.[\s\S]*Alejandro Galán Alcaraz[\s\S]*comunicar, conectar y aportar valor\./,
  );
  assert.equal(
    await page
      .locator("#sobre-mi")
      .evaluate((section) => section.previousElementSibling?.className),
    "vinyl-section",
  );
  assert.equal(await page.locator(".gfx-letters").count(), 0);
  assert.equal(await page.locator(".album").count(), 8);
  assert.equal(
    await page.locator(".album-playback, .album-counter").count(),
    0,
  );
  await page.locator(".album-dot").first().click();
  assert.equal(
    await page.locator(".album").first().getAttribute("aria-current"),
    "true",
  );
  await page.locator(".album-next").click();
  assert.equal(
    await page.locator(".album").nth(1).getAttribute("aria-current"),
    "true",
  );
  await page.locator(".album-prev").click();
  assert.equal(
    await page.locator(".album").first().getAttribute("aria-current"),
    "true",
  );
  await page.locator(".album-prev").click();
  assert.equal(
    await page.locator(".album").last().getAttribute("aria-current"),
    "true",
  );
  await page.locator(".album-dot").nth(3).click();
  assert.equal(await page.locator(".album-caption").innerText(), "I Got");
  await page.locator(".album-dot").nth(3).press("ArrowRight");
  assert.equal(await page.locator(".album-caption").innerText(), "One Million");
  await page.locator(".album-dot").first().click();
  await page.waitForTimeout(900);
  if (label === "desktop") {
    await page.locator(".album.is-right").click();
    assert.equal(
      await page.locator(".album").nth(1).getAttribute("aria-current"),
      "true",
    );
    await page.waitForTimeout(900);
  }
  const albumSizes = await page
    .locator(".album")
    .evaluateAll((items) =>
      items.map((item) => [
        getComputedStyle(item).width,
        getComputedStyle(item).height,
      ]),
    );
  assert.ok(
    albumSizes.every(([w, h]) => w === h && w === albumSizes[0][0]),
    "Album covers must share the same square base size",
  );
  const record = await page
    .locator(".album.is-center .vinyl")
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  assert.ok(
    record > 50,
    "The active record should slide visibly out of its sleeve",
  );
  await page
    .locator(".vinyl-section")
    .screenshot({
      path: path.join(root, "reports", "screenshots", label + "-albums.png"),
    });
  assert.ok(
    await page.locator(".project-content").evaluateAll((items) =>
      items.every((el) => {
        const css = getComputedStyle(el);
        return (
          css.backgroundImage === "none" &&
          css.backgroundColor === "rgba(0, 0, 0, 0)" &&
          css.backdropFilter === "none" &&
          css.borderTopWidth === "0px"
        );
      }),
    ),
    "Project titles should have no background panels",
  );
  assert.ok(
    await page
      .locator(".album img")
      .evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
  );
  assert.ok(
    await page
      .locator(
        ".site-header, .hero-stage, .project-card, .project-content, .project-action, .project-dialog, .album, .cover",
      )
      .evaluateAll((elements) =>
        elements.every(
          (element) => getComputedStyle(element).borderRadius === "0px",
        ),
      ),
    `${label}: interface surfaces should have square corners`,
  );
  assert.equal(await page.locator('[data-project="gfx"]').count(), 0);

  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.waitForTimeout(700);
  const menuBox = await page.locator("#site-menu").boundingBox();
  assert.ok(menuBox);
  assert.equal(
    Math.round(menuBox.height),
    height,
    `${label}: menu is not full height`,
  );
  assert.equal(
    Math.round(menuBox.x + menuBox.width),
    width,
    `${label}: menu is not on the right`,
  );
  assert.equal(await page.locator("#site-menu img").count(), 0);
  assert.equal(await page.locator("#site-menu nav a").count(), 4);
  await page.getByRole("button", { name: "Cerrar menú" }).click();
  await page.locator("#site-menu").waitFor({ state: "hidden" });

  assert.deepEqual(await page.locator(".project-category h3").allInnerTexts(), [
    "Identidad corporativa",
    "Edición audiovisual",
    "Fotografía",
  ]);
  assert.deepEqual(
    await page
      .locator(".project-category")
      .evaluateAll((sections) =>
        sections.map(
          (section) => section.querySelectorAll(".project-card").length,
        ),
      ),
    [1, 2, 2],
  );
  if (label === "desktop") {
    const audiovisual = page.locator(".project-category").nth(1);
    const first = audiovisual.locator(".project-card").first();
    const second = audiovisual.locator(".project-card").last();
    await audiovisual.locator("h3").hover();
    await page.waitForTimeout(900);
    const initialWidth = (await first.boundingBox()).width;
    await first.hover();
    await page.waitForTimeout(180);
    const openingWidth = (await first.boundingBox()).width;
    await page.waitForTimeout(850);
    const expandedWidth = (await first.boundingBox()).width;
    assert.ok(
      openingWidth > initialWidth + 2 && openingWidth < expandedWidth - 5,
      "Showcase should expand progressively instead of jumping",
    );
    assert.ok(
      (await first.boundingBox()).width > (await second.boundingBox()).width,
    );
    await audiovisual.locator("h3").hover();
    await page.waitForTimeout(180);
    const closingWidth = (await first.boundingBox()).width;
    assert.ok(
      closingWidth < expandedWidth - 2 && closingWidth > initialWidth + 5,
      "Showcase should close progressively instead of jumping",
    );
    await page.waitForTimeout(850);
    assert.ok(Math.abs((await first.boundingBox()).width - initialWidth) < 2);
    await second.hover();
    await page.waitForTimeout(900);
    assert.ok(
      (await second.boundingBox()).width > (await first.boundingBox()).width,
    );
  }
  await page.getByRole("button", { name: "Abrir proyecto Trama" }).click();
  assert.equal(await page.locator("#dialog-title").innerText(), "TRAMA");
  assert.equal(await page.locator(".manual-counter").innerText(), "1 / 29");
  assert.equal(await page.locator("#dialog-links a").count(), 0);
  await page.waitForFunction(() => {
    const image = document.querySelector(".manual-stage img");
    return image?.complete && image.naturalWidth > 0;
  });
  await page
    .getByRole("button", { name: "Página siguiente del manual" })
    .click();
  assert.equal(await page.locator(".manual-counter").innerText(), "2 / 29");
  await page.getByRole("button", { name: "Ampliar página del manual" }).click();
  assert.equal(
    await page.locator(".manual-zoom").getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Ajustar página del manual" }).click();
  await page.locator(".manual-stage").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator(".manual-counter").innerText(), "1 / 29");
  if (label === "desktop") {
    await page.waitForTimeout(750);
    await page.screenshot({
      path: path.join(root, "reports", "screenshots", "modal-check.png"),
    });
  }
  await page.getByRole("button", { name: "Proyecto siguiente" }).click();
  assert.equal(await page.locator("#dialog-title").innerText(), "CARMÍN");
  await page.getByRole("button", { name: "Cerrar proyecto" }).click();
  await page.locator("#project-dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Abrir archivo fotográfico" }).click();
  assert.equal(await page.locator(".carousel-slide").count(), 4);
  assert.equal(await page.locator(".carousel-count").innerText(), "01 / 04");
  const photosFit = await page
    .locator(".carousel-slide img")
    .evaluateAll((images) =>
      images.every((image) => getComputedStyle(image).objectFit === "contain"),
    );
  assert.ok(photosFit, `${label}: gallery photos should remain complete`);
  if (label === "mobile-small") {
    const galleryFits = await page
      .locator("#project-dialog")
      .evaluate((element) => element.scrollHeight <= element.clientHeight + 1);
    assert.ok(galleryFits, "small mobile gallery controls should stay visible");
  }
  if (label === "desktop") {
    await page.waitForTimeout(750);
    await page.screenshot({
      path: path.join(root, "reports", "screenshots", "gallery-check.png"),
    });
  }
  await page.getByRole("button", { name: "Fotografía siguiente" }).click();
  await page.waitForFunction(
    () => document.querySelector(".carousel-count")?.textContent === "02 / 04",
  );
  assert.match(
    await page
      .getByRole("link", { name: /Ver foto original/ })
      .getAttribute("href"),
    /fotografia-2\.JPG$/,
  );
  await page.waitForTimeout(500);
  await page.locator(".carousel-track").evaluate((track) => {
    track.scrollTo({ left: track.clientWidth * 2, behavior: "instant" });
  });
  await page.waitForFunction(
    () => document.querySelector(".carousel-count")?.textContent === "03 / 04",
  );
  await page.getByRole("button", { name: "Ver fotografía 4" }).click();
  await page.waitForFunction(
    () => document.querySelector(".carousel-count")?.textContent === "04 / 04",
  );
  await page.getByRole("button", { name: "Cerrar proyecto" }).click();
  await page.locator("#project-dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Abrir proyecto Carmín" }).click();
  assert.match(
    await page.locator("#dialog-media iframe").getAttribute("src"),
    /youtube-nocookie\.com\/embed\/8_iNv5ftGKc/,
  );
  assert.equal(await page.locator("#dialog-media video").count(), 0);
  assert.equal(
    await page
      .getByRole("link", { name: /Ver en YouTube/ })
      .getAttribute("href"),
    "https://www.youtube.com/watch?v=8_iNv5ftGKc",
  );
  await page.getByRole("button", { name: "Cerrar proyecto" }).click();
  await page.locator("#project-dialog").waitFor({ state: "hidden" });
  assert.deepEqual(errors, [], `${label}: page errors`);

  results.push({
    label,
    layout,
    menuFullHeight: true,
    projectCategories: 3,
    projectDialog: "passed",
  });
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
