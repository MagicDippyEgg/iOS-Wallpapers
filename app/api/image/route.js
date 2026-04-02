import fs from "fs";
import path from "path";

export async function GET(req) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");

  if (!filePath) {
    return new Response("Missing path", { status: 400 });
  }

  try {
    const fullPath = path.join(process.cwd(), filePath);

    const file = fs.readFileSync(fullPath);

    return new Response(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000"
      }
    });
  } catch (e) {
    return new Response("Not found", { status: 404 });
  }
}
