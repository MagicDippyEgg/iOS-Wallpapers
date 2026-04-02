const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd());

function scan(dir, results = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      scan(full, results);
    } else if (item.endsWith(".png") || item.endsWith(".jpg")) {
      const rel = path.relative(ROOT, full).replace(/\\/g, "/");
      results.push(rel);
    }
  }

  return results;
}

const files = scan(ROOT);

fs.writeFileSync(
  path.join(ROOT, "wallpapers.json"),
  JSON.stringify(files, null, 2)
);

console.log("Generated wallpapers.json");
