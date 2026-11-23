import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT || process.argv[2] || 3460);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".map": "application/json",
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const joined = path.normalize(path.join(root, decoded));
  if (!joined.startsWith(root)) return null;
  return joined;
}

async function resolveFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const index = path.join(filePath, "index.html");
      await fs.access(index);
      return index;
    }
    return filePath;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    let pathname = new URL(req.url || "/", `http://localhost:${PORT}`).pathname;
    if (pathname.endsWith("/") && pathname !== "/") {
      // keep trailing slash for directory index
    } else if (!path.extname(pathname) && pathname !== "/") {
      const asDir = safeJoin(ROOT, pathname);
      if (asDir) {
        try {
          const st = await fs.stat(asDir);
          if (st.isDirectory()) pathname = pathname.endsWith("/") ? pathname : pathname + "/";
        } catch {
          /* not a dir */
        }
      }
    }

    const target = safeJoin(ROOT, pathname === "/" ? "/index.html" : pathname);
    if (!target) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const file = await resolveFile(target);
    if (!file) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err?.message || err));
  }
});

server.listen(PORT, () => {
  console.log(`Previewing ${ROOT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop");
});
