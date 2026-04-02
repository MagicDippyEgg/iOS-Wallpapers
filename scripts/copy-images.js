const fs = require("fs");
const path = require("path");

const sourceDirs = ["iPhone", "iPad", "CarPlay", "iPod touch"];
const outDir = path.join(process.cwd(), "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  const items = fs.readdirSync(src);

  for (const item of items) {
    const s = path.join(src, item);
    const d = path.join(dest, item);

    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

for (const dir of sourceDirs) {
  copyDir(dir, path.join(outDir, dir));
}

console.log("Copied wallpapers into /public");
