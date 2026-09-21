"use client";

import { useEffect, useState } from "react";

interface StoredUserData {
  id?: string;
  full_name?: string;
}

function readIdentifier(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("userData");
    if (!raw) return null;
    const data: StoredUserData = JSON.parse(raw);
    if (data.full_name) return data.full_name;
    if (data.id) return `User #${data.id}`;
  } catch {
    // Malformed/missing localStorage data - render without a watermark
    // rather than throwing, since this is a deterrent, not a gate.
  }
  return null;
}

function buildTileDataUri(label: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="220">
      <text x="180" y="110" font-family="sans-serif" font-size="14"
            fill="rgba(17,17,17,0.07)" text-anchor="middle"
            transform="rotate(-28 180 110)">${label}</text>
    </svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Subtle, non-interactive tiled watermark (account identifier + a
 * periodically-refreshed timestamp) for sensitive authenticated views -
 * reports, candidate detail, evaluation results. A deterrent against
 * casual screenshot redistribution (a screenshot can be traced back to
 * who was viewing it and roughly when), not a way to prevent screenshots
 * themselves - nothing client-side can do that.
 *
 * Renders nothing for a signed-out visitor (no identifier available) or
 * before the client has hydrated, so it never affects public pages.
 */
export function Watermark() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const identifier = readIdentifier();
      if (!identifier) {
        setLabel(null);
        return;
      }
      const timestamp = new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLabel(`${identifier} · ${timestamp}`);
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!label) return null;

  return (
    <div
      aria-hidden="true"
      // z-40, deliberately below the app's modal/dialog layer (z-50, see
      // candidate-modal.tsx's <Dialog className="z-50">) so the watermark
      // never visually overlaps a form/dialog the user is actively using -
      // pointer-events:none already keeps it from blocking clicks either way.
      className="pointer-events-none fixed inset-0 z-40 select-none"
      style={{
        backgroundImage: `url("${buildTileDataUri(label)}")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}
