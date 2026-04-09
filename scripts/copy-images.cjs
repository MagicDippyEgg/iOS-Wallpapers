const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const sourceDirs = ["iPhone", "iPad", "CarPlay", "iPod touch"];
const outDir = path.join(process.cwd(), "public");
const isVercelBuild = process.env.VERCEL === "1";

function hasCgbiChunk(fileBuffer) {
  if (fileBuffer.length < 8 || !fileBuffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return false;
  }

  let offset = 8;
  while (offset + 12 <= fileBuffer.length) {
    const length = fileBuffer.readUInt32BE(offset);
    const type = fileBuffer.subarray(offset + 4, offset + 8).toString("ascii");
    const nextOffset = offset + 12 + length;

    if (nextOffset > fileBuffer.length) {
      return false;
    }

    if (type === "CgBI") {
      return true;
    }

    if (type === "IEND") {
      return false;
    }

    offset = nextOffset;
  }

  return false;
}

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

function convertCgbiPng(fileBuffer) {
  let offset = 8;
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

    if (type === "IHDR") {
      ihdr = Buffer.from(data);
    } else if (type === "IDAT") {
      idatParts.push(Buffer.from(data));
    } else if (type !== "CgBI" && type !== "IEND") {
      passthroughChunks.push({ type, data: Buffer.from(data) });
    }

    offset = dataEnd + 4;
    if (type === "IEND") {
      break;
    }
  }

  if (!ihdr || idatParts.length === 0) {
    return fileBuffer;
  }

  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];

  if (bitDepth !== 8 || colorType !== 6) {
    return fileBuffer;
  }

  let inflated;
  try {
    inflated = zlib.inflateRawSync(Buffer.concat(idatParts));
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

function copyDir(src, dest, stats) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  const items = fs.readdirSync(src);

  for (const item of items) {
    const s = path.join(src, item);
    const d = path.join(dest, item);

    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d, stats);
      continue;
    }

    if (path.extname(item).toLowerCase() !== ".png") {
      fs.copyFileSync(s, d);
      continue;
    }

    const buffer = fs.readFileSync(s);
    if (!hasCgbiChunk(buffer)) {
      fs.copyFileSync(s, d);
      continue;
    }

    fs.writeFileSync(d, convertCgbiPng(buffer));
    stats.converted += 1;
  }
}

function removePathIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

const stats = { converted: 0 };
for (const dir of sourceDirs) {
  copyDir(dir, path.join(outDir, dir), stats);
}

if (isVercelBuild) {
  for (const dir of sourceDirs) {
    removePathIfExists(path.join(process.cwd(), dir));
  }
  removePathIfExists(path.join(process.cwd(), ".git"));
}

console.log(`Copied wallpapers into /public (converted ${stats.converted} legacy CgBI PNGs)`);

if (isVercelBuild) {
  console.log("Vercel build detected: cleaned source wallpaper folders and .git to reduce disk usage.");
}
