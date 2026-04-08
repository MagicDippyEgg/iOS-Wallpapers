import fs from "fs";
import path from "path";
import zlib from "zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4"
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcValue >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function maybeConvertCgbiPng(fileBuffer) {
  if (!fileBuffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return fileBuffer;
  }

  let offset = 8;
  let hasCgbi = false;
  let ihdr = null;
  const idatParts = [];
  const passthroughChunks = [];

  while (offset + 12 <= fileBuffer.length) {
    const length = fileBuffer.readUInt32BE(offset);
    const type = fileBuffer.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (dataEnd + 4 > fileBuffer.length) {
      return fileBuffer;
    }

    const data = fileBuffer.subarray(dataStart, dataEnd);

    if (type === "CgBI") {
      hasCgbi = true;
    } else if (type === "IHDR") {
      ihdr = Buffer.from(data);
    } else if (type === "IDAT") {
      idatParts.push(Buffer.from(data));
    } else if (type !== "IEND") {
      passthroughChunks.push({ type, data: Buffer.from(data) });
    }

    offset = dataEnd + 4;
    if (type === "IEND") {
      break;
    }
  }

  if (!hasCgbi || !ihdr || idatParts.length === 0) {
    return fileBuffer;
  }

  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];

  if (bitDepth !== 8 || colorType !== 6) {
    return fileBuffer;
  }

  const idat = Buffer.concat(idatParts);
  let inflated;
  try {
    inflated = zlib.inflateRawSync(idat);
  } catch {
    return fileBuffer;
  }

  const stride = width * 4;
  const rowLength = stride + 1;
  if (inflated.length !== rowLength * height) {
    return fileBuffer;
  }

  const rgba = Buffer.from(inflated);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLength;
    for (let x = 0; x < width; x++) {
      const i = rowStart + 1 + x * 4;

      const b = rgba[i];
      const g = rgba[i + 1];
      const r = rgba[i + 2];
      const a = rgba[i + 3];

      if (a > 0) {
        rgba[i] = Math.min(255, Math.round((r * 255) / a));
        rgba[i + 1] = Math.min(255, Math.round((g * 255) / a));
        rgba[i + 2] = Math.min(255, Math.round((b * 255) / a));
      } else {
        rgba[i] = 0;
        rgba[i + 1] = 0;
        rgba[i + 2] = 0;
      }
    }
  }

  const standardIdat = zlib.deflateSync(rgba);

  const outChunks = [makeChunk("IHDR", ihdr)];
  for (const chunk of passthroughChunks) {
    outChunks.push(makeChunk(chunk.type, chunk.data));
  }
  outChunks.push(makeChunk("IDAT", standardIdat));
  outChunks.push(makeChunk("IEND", Buffer.alloc(0)));

  return Buffer.concat([PNG_SIGNATURE, ...outChunks]);
}

export async function GET(req) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");

  if (!filePath) {
    return new Response("Missing path", { status: 400 });
  }

  try {
    const publicRoot = path.join(process.cwd(), "public");
    const fullPath = path.resolve(publicRoot, filePath);

    if (!fullPath.startsWith(publicRoot + path.sep) && fullPath !== publicRoot) {
      return new Response("Invalid path", { status: 400 });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    let file = fs.readFileSync(fullPath);

    if (ext === ".png") {
      file = maybeConvertCgbiPng(file);
    }

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
