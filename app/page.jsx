"use client";

import { useEffect, useMemo, useState } from "react";

const OWNER = "MagicDippyEgg";
const REPO = "iOS-Wallpapers";
const BRANCH = "main";

async function fetchRepoTree() {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`
  );
  if (!res.ok) throw new Error("Failed to load repo tree");
  const data = await res.json();
  return data.tree;
}

function buildTree(items) {
  const root = {};

  for (const item of items) {
    if (item.type !== "blob") continue;

    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        if (!current._files) current._files = [];
        current._files.push(item.path);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }

  return root;
}

function getImageUrl(path) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
}

export default function App() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ios, setIos] = useState(null);
  const [device, setDevice] = useState(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRepoTree();
        const built = buildTree(data);
        setTree(built);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const iosVersions = useMemo(() => {
    if (!tree) return [];
    return Object.keys(tree).filter((k) => k !== "_files");
  }, [tree]);

  const devices = useMemo(() => {
    if (!tree || !ios) return [];
    return Object.keys(tree[ios] || {}).filter((k) => k !== "_files");
  }, [tree, ios]);

  const sizes = useMemo(() => {
    if (!tree || !ios || !device) return [];
    return Object.keys(tree[ios][device] || {}).filter((k) => k !== "_files");
  }, [tree, ios, device]);

  const files = useMemo(() => {
    if (!tree || !ios || !device || !size) return [];
    return tree[ios][device][size]?._files || [];
  }, [tree, ios, device, size]);

  if (loading) {
    return (
      <div className="p-6 text-lg font-semibold">
        Loading wallpaper library...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">iOS Wallpapers Navigator</h1>

      {/* Step 1 */}
      <div>
        <h2 className="font-semibold">1. iOS Version</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {iosVersions.map((v) => (
            <button
              key={v}
              onClick={() => {
                setIos(v);
                setDevice(null);
                setSize(null);
              }}
              className={`px-3 py-1 rounded border ${ios === v ? "bg-black text-white" : ""}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 */}
      {ios && (
        <div>
          <h2 className="font-semibold">2. Device</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {devices.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDevice(d);
                  setSize(null);
                }}
                className={`px-3 py-1 rounded border ${device === d ? "bg-black text-white" : ""}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {device && (
        <div>
          <h2 className="font-semibold">3. Screen Size</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-3 py-1 rounded border ${size === s ? "bg-black text-white" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 */}
      {size && (
        <div>
          <h2 className="font-semibold">Wallpapers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            {files.map((f) => (
              <a key={f} href={getImageUrl(f)} target="_blank">
                <img
                  src={getImageUrl(f)}
                  className="rounded shadow"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

