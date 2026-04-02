"use client";

import { useEffect, useState } from "react";

const OWNER = "MagicDippyEgg";
const REPO = "iOS-Wallpapers";
const BRANCH = "main";

async function fetchDir(path = "") {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`
  );
  return await res.json();
}

function getImageUrl(path) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [iosVersions, setIosVersions] = useState([]);
  const [wallpapers, setWallpapers] = useState([]);

  const [device, setDevice] = useState(null);
  const [size, setSize] = useState(null);
  const [ios, setIos] = useState(null);

  // Load devices
  useEffect(() => {
    fetchDir().then((data) => {
      setDevices(data.filter((d) => d.type === "dir"));
    });
  }, []);

  // Load sizes
  useEffect(() => {
    if (!device) return;
    fetchDir(device.name).then((data) => {
      setSizes(data.filter((d) => d.type === "dir"));
    });
  }, [device]);

  // Load iOS versions
  useEffect(() => {
    if (!device || !size) return;
    fetchDir(`${device.name}/${size.name}`).then((data) => {
      setIosVersions(data.filter((d) => d.type === "dir"));
    });
  }, [device, size]);

  // Load wallpapers
  useEffect(() => {
    if (!device || !size || !ios) return;
    fetchDir(`${device.name}/${size.name}/${ios.name}/Stills`).then((data) => {
      setWallpapers(data.filter((f) => f.name.endsWith(".png") || f.name.endsWith(".jpg")));
    });
  }, [device, size, ios]);

  return (
    <div style={{ padding: 20 }}>
      <h1>iOS Wallpapers Navigator</h1>

      <h2>1. Device</h2>
      {devices.map((d) => (
        <button key={d.name} onClick={() => {
          setDevice(d);
          setSize(null);
          setIos(null);
        }}>
          {d.name}
        </button>
      ))}

      {device && (
        <>
          <h2>2. Size</h2>
          {sizes.map((s) => (
            <button key={s.name} onClick={() => {
              setSize(s);
              setIos(null);
            }}>
              {s.name}
            </button>
          ))}
        </>
      )}

      {size && (
        <>
          <h2>3. iOS Version</h2>
          {iosVersions.map((v) => (
            <button key={v.name} onClick={() => setIos(v)}>
              {v.name}
            </button>
          ))}
        </>
      )}

      {ios && (
        <>
          <h2>Wallpapers</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10
          }}>
            {wallpapers.map((w) => (
              <a key={w.path} href={getImageUrl(w.path)} target="_blank">
                <img src={getImageUrl(w.path)} style={{ width: "100%" }} />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
