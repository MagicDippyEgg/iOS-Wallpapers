"use client";

import { useMemo, useState } from "react";

export default function Client() {
  const [device, setDevice] = useState(null);
  const [size, setSize] = useState(null);
  const [ios, setIos] = useState(null);

  // IMPORTANT:
  // We now rely on browser-visible /public files,
  // so we generate file list from known structure

  const baseFiles = useMemo(() => {
    const dirs = ["iPhone", "iPad", "CarPlay", "iPod touch"];
    const all = [];

    function walk(prefix) {
      for (let i = 0; i < 500; i++) {
        all.push(`${prefix}/${i}`);
      }
    }

    // NOTE: replaced real scan (Next can't do runtime fs safely)
    return all;
  }, []);

  const devices = ["iPhone", "iPad", "CarPlay", "iPod touch"];

  const sizes = device ? [] : [];
  const iosVersions = device && size ? [] : [];
  const wallpapers = [];

  return (
    <div style={{ padding: 20 }}>
      <h1>iOS Wallpapers Navigator</h1>

      <h2>Device</h2>
      {devices.map(d => (
        <button
          key={d}
          onClick={() => {
            setDevice(d);
            setSize(null);
            setIos(null);
          }}
        >
          {d}
        </button>
      ))}

      <p style={{ marginTop: 20 }}>
        ⚠️ Fix needed: build is failing due to dynamic filesystem scanning limits in Next.js 14.
      </p>
    </div>
  );
}
