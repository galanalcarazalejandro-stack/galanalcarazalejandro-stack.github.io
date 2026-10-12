import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

const root = path.resolve(import.meta.dirname, "../..");
const output = path.join(root, "assets", "images", "projects", "trama-manual");
await fs.mkdir(output, { recursive: true });
const loadingTask = pdfjs.getDocument({
  data: new Uint8Array(
    await fs.readFile(
      path.join(
        root,
        "proyectos",
        "identidad",
        "trama",
        "MANUAL DE MARCA TRAMA.pdf",
      ),
    ),
  ),
  useSystemFonts: true,
  disableFontFace: true,
});
const pdf = await loadingTask.promise;
let bytes = 0;
for (let number = 1; number <= pdf.numPages; number++) {
  const page = await pdf.getPage(number);
  const viewport = page.getViewport({
    scale: 1800 / page.getViewport({ scale: 1 }).width,
  });
  const canvas = createCanvas(
    Math.round(viewport.width),
    Math.round(viewport.height),
  );
  await page.render({
    canvasContext: canvas.getContext("2d"),
    viewport,
    canvas,
  }).promise;
  const target = path.join(
    output,
    `page-${String(number).padStart(2, "0")}.webp`,
  );
  await sharp(canvas.toBuffer("image/png"))
    .webp({ quality: 88, effort: 5 })
    .toFile(target);
  bytes += (await fs.stat(target)).size;
  page.cleanup();
}
console.log(`TRAMA: ${pdf.numPages} pages, ${bytes} bytes`);
await loadingTask.destroy();
