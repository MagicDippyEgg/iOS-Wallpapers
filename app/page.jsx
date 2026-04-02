"use client";

import fs from "fs";
import path from "path";
import { useState } from "react";

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

const files = getAllWallpapers();

export default function Page() {
  const [device, setDevice] = useState(null);
  const [size, setSize] = useState(null);
  const [ios, setIos] = useState(null);

  const devices = [...new Set(files.map(f => f.split("/")[0]))];

  const sizes = device
    ? [...new Set(files
        .filter(f => f.startsWith(device + "/"))
        .map(f => f.split("/")[1]))]
    : [];

  const iosVersions = (device && size)
    ? [...new Set(files
        .filter(f => f.startsWith(`${device}/${size}/`))
        .map(f => f.split("/")[2]))]
    : [];

  const wallpapers = (device && size && ios)
    ? files.filter(f =>
        f.startsWith(`${device}/${size}/${ios}/Stills/`)
      )
    : [];

  return (
    <div style={{ padding: 20 }}>
      <h1>iOS Wallpapers Navigator</h1>

      {/* Device */}
      <h2>1. Device</h2>
      {devices.map(d => (
        <button key={d} onClick={() => {
          setDevice(d);
          setSize(null);
          setIos(null);
        }}>
          {d}
        </button>
      ))}

      {/* Size */}
      {device && (
        <>
          <h2>2. Size</h2>
          {sizes.map(s => (
            <button key={s} onClick={() => {
              setSize(s);
              setIos(null);
            }}>
              {s}
            </button>
          ))}
        </>
      )}

      {/* iOS */}
      {size && (
        <>
          <h2>3. iOS Version</h2>
          {iosVersions.map(v => (
            <button key={v} onClick={() => setIos(v)}>
              {v}
            </button>
          ))}
        </>
      )}

      {/* Wallpapers */}
      {ios && (
        <>
          <h2>Wallpapers</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10
          }}>
            {wallpapers.map(w => (
              <a key={w} href={`/${w}`} target="_blank">
                <img src={`/${w}`} style={{ width: "100%" }} />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
