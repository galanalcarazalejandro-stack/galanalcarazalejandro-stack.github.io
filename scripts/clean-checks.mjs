import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const screenshots = path.join(root, "reports", "screenshots");
try {
  const resolved = await fs.realpath(screenshots);
  if (!resolved.startsWith(root + path.sep))
    throw new Error("Invalid screenshots directory");
  for (const entry of await fs.readdir(resolved, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".png")
      continue;
    const target = path.resolve(resolved, entry.name);
    if (!target.startsWith(resolved + path.sep))
      throw new Error("Invalid screenshot path");
    await fs.unlink(target);
    console.log("Removed reports/screenshots/" + entry.name);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
