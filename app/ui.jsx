"use client";

import { useMemo, useState } from "react";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function toPublicUrl(file) {
  return `/${file.split("/").map(encodeURIComponent).join("/")}`;
}

function parsePathParts(file) {
  const parts = file.split("/");

  if (parts.length < 4) {
    return null;
  }

  const [device, size, ios, type] = parts;
  const name = parts[parts.length - 1];
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";

  return {
    file,
    url: toPublicUrl(file),
    device,
    size,
    ios,
    type,
    name,
    ext,
    isImage: IMAGE_EXTENSIONS.has(ext)
  };
}

export default function Client({ files = [] }) {
  const [device, setDevice] = useState(null);
  const [size, setSize] = useState(null);
  const [ios, setIos] = useState(null);

  const items = useMemo(() => files.map(parsePathParts).filter(Boolean), [files]);

  const devices = useMemo(
    () => [...new Set(items.map((x) => x.device))].sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const sizes = useMemo(() => {
    if (!device) return [];
    return [...new Set(items.filter((x) => x.device === device).map((x) => x.size))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [items, device]);

  const iosVersions = useMemo(() => {
    if (!device || !size) return [];

    return [
      ...new Set(
        items
          .filter((x) => x.device === device && x.size === size)
          .map((x) => x.ios)
      )
    ].sort((a, b) => a.localeCompare(b));
  }, [items, device, size]);

  const wallpapers = useMemo(() => {
    if (!device || !size || !ios) return [];

    return items
      .filter((x) => x.device === device && x.size === size && x.ios === ios)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, device, size, ios]);

  const pickerStyle = {
    marginRight: 8,
    marginBottom: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    cursor: "pointer"
  };

  return (
    <div style={{ padding: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>iOS Wallpapers Navigator</h1>
      <p>Browse by device, size and iOS version.</p>

      <h2>Device</h2>
      <div>
        {devices.map((d) => (
          <button
            key={d}
            style={{
              ...pickerStyle,
              background: d === device ? "#111" : "#fff",
              color: d === device ? "#fff" : "#111"
            }}
            onClick={() => {
              setDevice(d);
              setSize(null);
              setIos(null);
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {device && (
        <>
          <h2>Size</h2>
          <div>
            {sizes.map((s) => (
              <button
                key={s}
                style={{
                  ...pickerStyle,
                  background: s === size ? "#111" : "#fff",
                  color: s === size ? "#fff" : "#111"
                }}
                onClick={() => {
                  setSize(s);
                  setIos(null);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      {device && size && (
        <>
          <h2>iOS / iPadOS Version</h2>
          <div>
            {iosVersions.map((v) => (
              <button
                key={v}
                style={{
                  ...pickerStyle,
                  background: v === ios ? "#111" : "#fff",
                  color: v === ios ? "#fff" : "#111"
                }}
                onClick={() => setIos(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      )}

      {ios && (
        <>
          <h2>Wallpapers ({wallpapers.length})</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12
            }}
          >
            {wallpapers.map((w) => (
              <article
                key={w.file}
                style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 8 }}
              >
                {w.isImage ? (
                  <img
                    src={w.url}
                    alt={w.name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: 240,
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "#f2f2f2"
                    }}
                  />
                ) : (
                  <video
                    controls
                    preload="metadata"
                    style={{ width: "100%", borderRadius: 8, background: "#000" }}
                  >
                    <source
                      src={w.url}
                      type={w.ext === "mov" ? "video/quicktime" : "video/mp4"}
                    />
                  </video>
                )}
                <p style={{ margin: "8px 0 4px", fontSize: 12, wordBreak: "break-all" }}>
                  {w.name}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
