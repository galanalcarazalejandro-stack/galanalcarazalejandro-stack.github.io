import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".ai": "application/pdf",
  ".heic": "image/heic",
};

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, `http://localhost:${port}`).pathname,
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  const file = path.resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404).end();
      return;
    }
    const headers = {
      "Content-Type":
        types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Accept-Ranges": "bytes",
    };
    const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || "");
    if (match) {
      const start = Number(match[1]);
      const end = match[2]
        ? Math.min(Number(match[2]), stat.size - 1)
        : stat.size - 1;
      if (start > end || start >= stat.size) {
        response
          .writeHead(416, { "Content-Range": `bytes */${stat.size}` })
          .end();
        return;
      }
      response.writeHead(206, {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Content-Length": end - start + 1,
      });
      fs.createReadStream(file, { start, end }).pipe(response);
    } else {
      response.writeHead(200, { ...headers, "Content-Length": stat.size });
      fs.createReadStream(file).pipe(response);
    }
  });
}).listen(port, "127.0.0.1", () =>
  console.log(`GFX disponible en http://127.0.0.1:${port}`),
);
