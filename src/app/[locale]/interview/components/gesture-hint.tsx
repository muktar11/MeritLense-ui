"use client";

import { useEffect, useState } from "react";

interface GestureHintProps {
  targetId: string;
  label: string;
}

// Points a "Glide + tap gesture" hint (a fingertip that glides onto the
// target, presses, ripples, and glides back out, looping) at a real,
// already-mounted control - a text label plus the animated tap, not a
// blocking modal. Renders nothing whenever the target isn't currently in
// the DOM (e.g. the speak button disappears mid-recording, replaced by a
// Stop button) - callers don't need to special-case that themselves.
export function GestureHint({ targetId, label }: GestureHintProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(targetId);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    // Layout can shift under the target (e.g. the audio player appearing
    // after "Listen" is pressed) without a scroll/resize event firing -
    // a cheap poll is simpler and safer here than wiring a ResizeObserver
    // to every possible ancestor.
    const interval = setInterval(update, 200);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  if (!rect) return null;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dotSize = 22;
  const ringSize = 16;

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      <div
        className="absolute flex flex-col items-center -translate-x-1/2"
        style={{ left: centerX, top: rect.top - 44 }}
      >
        <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          {label}
        </span>
        <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
      </div>

      <span
        className="tour-ripple-ring absolute rounded-full border-2 border-purple-500"
        style={{
          left: centerX - ringSize / 2,
          top: centerY - ringSize / 2,
          width: ringSize,
          height: ringSize,
        }}
      />
      <span
        className="tour-glide-dot absolute rounded-full"
        style={
          {
            left: centerX - dotSize / 2,
            top: centerY - dotSize / 2,
            width: dotSize,
            height: dotSize,
            background: "radial-gradient(circle at 35% 30%, #fff, #a855f7 55%, #7c3aed 100%)",
            boxShadow: "0 0 14px 2px rgba(168, 85, 247, 0.55)",
            "--tour-gx": "34px",
            "--tour-gy": "-34px",
          } as React.CSSProperties
        }
      />
    </div>
  );
}
