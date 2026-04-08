"use client";

import { useMemo, useState } from "react";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function toApiUrl(file) {
  return `/api/image?path=${encodeURIComponent(file)}`;
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
    url: toApiUrl(file),
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

  const chipStyle = (active) => ({
    marginRight: 8,
    marginBottom: 8,
    padding: "9px 14px",
    borderRadius: 999,
    border: active ? "1px solid #7c9cff" : "1px solid #2f364a",
    background: active ? "#233053" : "#161b27",
    color: active ? "#dce7ff" : "#c8d0e3",
    cursor: "pointer",
    transition: "all .2s ease"
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 5% -10%, #2d3f73 0%, transparent 45%), linear-gradient(180deg, #0c101a 0%, #090c14 100%)",
        color: "#eef2ff",
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 36 }}>iOS Wallpapers Navigator</h1>
        <p style={{ color: "#b8c2d9", marginTop: 8 }}>
          Explore by device, screen size, and iOS / iPadOS version.
        </p>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 16,
            background: "rgba(17, 23, 36, 0.8)",
            border: "1px solid #263149"
          }}
        >
          <h3 style={{ marginTop: 0, color: "#dbe5ff" }}>Device</h3>
          <div>{devices.map((d) => <button key={d} style={chipStyle(d === device)} onClick={() => { setDevice(d); setSize(null); setIos(null); }}>{d}</button>)}</div>

          {device && (
            <>
              <h3 style={{ marginBottom: 8, color: "#dbe5ff" }}>Size</h3>
              <div>{sizes.map((s) => <button key={s} style={chipStyle(s === size)} onClick={() => { setSize(s); setIos(null); }}>{s}</button>)}</div>
            </>
          )}

          {device && size && (
            <>
              <h3 style={{ marginBottom: 8, color: "#dbe5ff" }}>iOS / iPadOS Version</h3>
              <div>{iosVersions.map((v) => <button key={v} style={chipStyle(v === ios)} onClick={() => setIos(v)}>{v}</button>)}</div>
            </>
          )}
        </div>

        {ios && (
          <>
            <h2 style={{ marginTop: 22, marginBottom: 10 }}>Wallpapers ({wallpapers.length})</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                gap: 14
              }}
            >
              {wallpapers.map((w) => (
                <article
                  key={w.file}
                  style={{
                    border: "1px solid #2d3953",
                    borderRadius: 14,
                    padding: 10,
                    background: "#101727"
                  }}
                >
                  {w.isImage ? (
                    <img
                      src={w.url}
                      alt={w.name}
                      loading="lazy"
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        borderRadius: 10,
                        background: "#0a0f1b"
                      }}
                    />
                  ) : (
                    <video
                      controls
                      preload="metadata"
                      style={{ width: "100%", borderRadius: 10, background: "#000" }}
                    >
                      <source
                        src={w.url}
                        type={w.ext === "mov" ? "video/quicktime" : "video/mp4"}
                      />
                    </video>
                  )}
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#c3cee3", wordBreak: "break-all" }}>
                    {w.name}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
