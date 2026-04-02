import fs from "fs";
import path from "path";
import Client from "./ui";

const ROOT = process.cwd();

function getAllWallpapers() {
  const results = [];

  function walk(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        walk(full);
      } else if (
        item.endsWith(".png") ||
        item.endsWith(".jpg")
      ) {
        const rel = path.relative(ROOT, full).replace(/\\/g, "/");
        results.push(rel);
      }
    }
  }

  walk(ROOT);
  return results;
}

export default function Page() {
  const files = getAllWallpapers();

  return <Client files={files} />;
}
