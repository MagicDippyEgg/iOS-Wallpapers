import fs from "fs";
import path from "path";

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4"
};

export async function GET(req) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");

  if (!filePath) {
    return new Response("Missing path", { status: 400 });
  }

  try {
    const root = process.cwd();
    const fullPath = path.resolve(root, filePath);

    if (!fullPath.startsWith(root)) {
      return new Response("Invalid path", { status: 400 });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    const file = fs.readFileSync(fullPath);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
