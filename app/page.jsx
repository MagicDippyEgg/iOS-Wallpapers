"use client";

import { useEffect, useMemo, useState } from "react";

const OWNER = "MagicDippyEgg";
const REPO = "iOS-Wallpapers";
const BRANCH = "main";

async function fetchRepoTree() {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`
  );
  const data = await res.json();
  return data.tree;
}

function getImageUrl(path) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
}

export default function App() {
  const [files, setFiles] = useState([]);

  const [device, setDevice] = useState(null);
  const [size, setSize] = useState(null);
  const [ios, setIos] = useState(null);

  useEffect(() => {
    fetchRepoTree().then((tree) => {
      const images = tree
        .filter(
          (item) =>
            item.type === "blob" &&
            (item.path.endsWith(".png") || item.path.endsWith(".jpg"))
        )
        .map((item) => item.path);

      setFiles(images);
    });
  }, []);

  const devices = useMemo(() => {
    return [...new Set(files.map((f) => f.split("/")[0]))];
  }, [files]);

  const sizes = useMemo(() => {
    if (!device) return [];
    return [
      ...new Set(
        files
          .filter((f) => f.startsWith(device + "/"))
          .map((f) => f.split("/")[1])
      ),
    ];
  }, [files, device]);

  const iosVersions = useMemo(() => {
    if (!device || !size) return [];
    return [
      ...new Set(
        files
          .filter((f) => f.startsWith(`${device}/${size}/`))
          .map((f) => f.split("/")[2])
      ),
    ];
  }, [files, device, size]);

  const wallpapers = useMemo(() => {
    if (!device || !size || !ios) return [];
    return files.filter((f) =>
      f.startsWith(`${device}/${size}/${ios}/Stills/`)
    );
  }, [files, device, size, ios]);

  return (
    <div style={{ padding: 20 }}>
      <h1>iOS Wallpapers Navigator</h1>

      <h2>1. Device</h2>
      {devices.map((d) => (
        <button key={d} onClick={() => {
          setDevice(d);
          setSize(null);
          setIos(null);
        }}>
          {d}
        </button>
      ))}

      {device && (
        <>
          <h2>2. Size</h2>
          {sizes.map((s) => (
            <button key={s} onClick={() => {
              setSize(s);
              setIos(null);
            }}>
              {s}
            </button>
          ))}
        </>
      )}

      {size && (
        <>
          <h2>3. iOS Version</h2>
          {iosVersions.map((v) => (
            <button key={v} onClick={() => setIos(v)}>
              {v}
            </button>
          ))}
        </>
      )}

      {ios && (
        <>
          <h2>Wallpapers</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {wallpapers.map((w) => (
              <a key={w} href={getImageUrl(w)} target="_blank">
                <img src={getImageUrl(w)} style={{ width: "100%" }} />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
