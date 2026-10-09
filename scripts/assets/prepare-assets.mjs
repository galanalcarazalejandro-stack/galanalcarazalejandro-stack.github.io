import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const input = path.join(root, "proyectos");
const output = path.join(root, "assets");
const archive = path.join(root, "archivo", "recursos-anteriores");
const hero = path.join(output, "images", "hero");
const exec = promisify(execFile);
for (const folder of [
  archive,
  hero,
  "images/brand",
  "images/projects",
  "images/photography",
  "videos",
].map((folder) =>
  path.isAbsolute(folder) ? folder : path.join(output, folder),
)) {
  await fs.mkdir(folder, { recursive: true });
}
await fs.copyFile(
  path.join(input, "identidad", "gfx", "gfx-logo.png"),
  path.join(output, "images", "brand", "gfx-logo.png"),
);
await sharp(path.join(input, "hero", "hero-img.jpg"))
  .resize({ width: 2400, withoutEnlargement: true })
  .webp({ quality: 86, effort: 5 })
  .toFile(path.join(archive, "hero-full.webp"));
for (const [source, target] of [
  ["hero-gfx.png", "hero-gfx-mobile.webp"],
  ["hero-person.png", "hero-person-mobile.webp"],
]) {
  await sharp(path.join(hero, source))
    .trim()
    .webp({ quality: 90, effort: 5 })
    .toFile(path.join(hero, target));
}

const raster = [
  ["portadas-albums/portada1.jpg", "images/projects/portada1.webp"],
  [
    "fotografia/Belleza angustiosa.jpg",
    "images/photography/belleza-angustiosa.webp",
  ],
  ["fotografia/fotografia-1.JPG", "images/photography/fotografia-1.webp"],
  ["fotografia/fotografia-2.JPG", "images/photography/fotografia-2.webp"],
  ["fotografia/fotografia-3.png", "images/photography/fotografia-3.webp"],
  ["fotografia/fotografia-4.png", "images/photography/fotografia-4.webp"],
];
// The HEIC is offered as an original download; the site does not use a WebP copy.
for (const [source, target] of raster) {
  try {
    const sourcePath = path.join(input, source);
    const meta = await sharp(sourcePath).metadata();
    console.log(source, meta.width, meta.height, meta.format);
    const destination = path.join(output, target);
    const isPhotograph = path
      .basename(source)
      .toLowerCase()
      .startsWith("fotografia-");
    await sharp(sourcePath)
      .rotate()
      .resize(
        isPhotograph
          ? {
              width: 1600,
              height: 1200,
              fit: "inside",
              withoutEnlargement: true,
            }
          : { width: 1800, withoutEnlargement: true },
      )
      .webp({ quality: isPhotograph ? 72 : 84, effort: 6 })
      .toFile(destination);
  } catch (error) {
    console.warn("Could not convert", source, error.message);
  }
}

async function renderPdf(source, target) {
  try {
    const bytes = await fs.readFile(path.join(input, source));
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({
      scale: Math.min(2, 1400 / page.getViewport({ scale: 1 }).width),
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
    await sharp(canvas.toBuffer("image/png"))
      .webp({ quality: 86 })
      .toFile(path.join(archive, target));
    console.log(source, pdf.numPages, "pages");
  } catch (error) {
    console.warn("Could not render PDF", source, error.message);
  }
}
await renderPdf(
  "identidad/trama/MANUAL DE MARCA TRAMA.pdf",
  "trama-cover.webp",
);
await renderPdf("identidad/gfx/gfx.ai", "gfx-logo.webp");

for (const [source, target] of [["audiovisual/ice/ICE_FINAL.mp4", "ice"]]) {
  try {
    await exec(
      ffmpeg,
      [
        "-y",
        "-i",
        path.join(input, source),
        "-map",
        "0:v:0",
        "-map",
        "0:a:0",
        "-vf",
        "scale=1920:-2,fps=30",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "24",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        path.join(output, "videos", `${target}-full.mp4`),
      ],
      { maxBuffer: 1024 * 1024 * 2 },
    );
    console.log(source, "full video created");
  } catch (error) {
    console.warn("Could not process video", source, error.message);
  }
}

await import("./prepare-albums.mjs");
await import("./prepare-manual.mjs");
