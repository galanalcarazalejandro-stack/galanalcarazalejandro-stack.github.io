import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const covers = [
  ["portada1.jpg", "carmin"],
  ["drakukeo-03.jpg.jpeg", "drakukeo-03"],
  ["drakukeo-04.jpg.jpeg", "drakukeo-04"],
  ["IGOT_01.jpg.jpeg", "igot"],
  ["ONEMILLION-05.jpg.jpeg", "one-million"],
  ["ONE_01.jpg.jpeg", "one"],
  ["TRAPLIFE_01.jpg.jpeg", "trap-life"],
  ["portada ice.jpg.jpeg", "ice"],
];
const output = path.join(root, "assets", "images", "albums");
await fs.mkdir(output, { recursive: true });
let originalBytes = 0;
let optimizedBytes = 0;
for (const [file, slug] of covers) {
  const source = path.join(root, "proyectos", "portadas-albums", file);
  const target = path.join(output, `album-${slug}.webp`);
  originalBytes += (await fs.stat(source)).size;
  await sharp(source)
    .rotate()
    .resize({
      width: 960,
      height: 960,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 6 })
    .toFile(target);
  optimizedBytes += (await fs.stat(target)).size;
}
console.log(`Album covers: ${originalBytes} → ${optimizedBytes} bytes`);
