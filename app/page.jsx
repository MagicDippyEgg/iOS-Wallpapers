import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd());

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

  const devices = [...new Set(files.map(f => f.split("/")[0]))];

  return (
    <div style={{ padding: 20 }}>
      <h1>iOS Wallpapers Navigator</h1>

      <h2>Devices</h2>
      {devices.map(d => (
        <div key={d}>{d}</div>
      ))}
    </div>
  );
}
