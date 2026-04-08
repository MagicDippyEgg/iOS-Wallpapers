import fs from "fs";
import path from "path";
import Client from "./ui";

const ROOT = process.cwd();
const WALLPAPER_DIRS = ["iPhone", "iPad", "iPod touch", "CarPlay"];
const SUPPORTED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".mp4",
  ".mov"
]);

function getAllWallpapers() {
  const results = [];

  function walk(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const full = path.join(dir, item.name);

      if (item.isDirectory()) {
        walk(full);
        continue;
      }

      const ext = path.extname(item.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        continue;
      }

      const rel = path.relative(ROOT, full).replace(/\\/g, "/");
      results.push(rel);
    }
  }

  for (const dir of WALLPAPER_DIRS) {
    const absoluteDir = path.join(ROOT, dir);
    if (fs.existsSync(absoluteDir)) {
      walk(absoluteDir);
    }
  }

  return results.sort((a, b) => a.localeCompare(b));
}

export default function Page() {
  const files = getAllWallpapers();

  return <Client files={files} />;
}
