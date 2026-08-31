"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Beat {
  target: HTMLElement | null;
  text: string;
}

interface CallControlsIntroProps {
  recordTarget: HTMLElement | null;
  languageTarget: HTMLElement | null;
}

const SEEN_KEY = "meritlense_live_call_intro_seen";
const BEAT_MS = 3200;

// A brief, self-dismissing spotlight on the two controls a first-time
// participant needs before they can do anything on this page: the record
// button and the language selectors. Unlike OrientationTour (interview/
// components/orientation-tour.tsx), which walks through illustrative mocks
// on its own full screen before the real UI exists yet, this points at the
// actual live elements already on screen - they're already mounted by the
// time this runs, so a real getBoundingClientRect() spotlight is possible
// and reads as more trustworthy than a mock of the same thing.
export function CallControlsIntro({ recordTarget, languageTarget }: CallControlsIntroProps) {
  const [dismissed, setDismissed] = useState(true);
  const [beatIndex, setBeatIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN_KEY)) return;
    if (!recordTarget || !languageTarget) return;
    setDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!recordTarget, !!languageTarget]);

  const beats: Beat[] = [
    { target: recordTarget, text: "Tap here to record your turn when it's your turn to speak." },
    { target: languageTarget, text: "Set the language you speak and the one you want to hear here." },
  ];
  const beat = beats[beatIndex];

  useEffect(() => {
    if (dismissed) return;
    const updateRect = () => setRect(beat.target?.getBoundingClientRect() ?? null);
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [dismissed, beat.target]);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      if (beatIndex < beats.length - 1) {
        setBeatIndex((i) => i + 1);
      } else {
        dismiss();
      }
    }, BEAT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed, beatIndex]);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Private browsing / storage disabled - just re-shows next time,
      // not worth failing the intro over.
    }
  };

  if (dismissed || !rect) return null;

  // Anchored above the target when there isn't room below it (the record
  // button sits near the bottom of a short viewport), flush against
  // whichever edge has the room.
  const spaceBelow = window.innerHeight - rect.bottom;
  const placeAbove = spaceBelow < 110;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/40" onClick={dismiss} style={{ pointerEvents: "auto" }} />

      <motion.div
        key={`ring-${beatIndex}`}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="absolute rounded-lg ring-4 ring-purple-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
      >
        <motion.div
          animate={{ opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-lg ring-4 ring-purple-300"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={beatIndex}
          initial={{ opacity: 0, y: placeAbove ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bg-white rounded-xl shadow-xl p-3 w-64 text-sm text-gray-800"
          style={{
            left: Math.min(Math.max(rect.left, 12), window.innerWidth - 268),
            top: placeAbove ? rect.top - 96 : rect.bottom + 14,
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              {beats.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === beatIndex ? "w-4 bg-purple-500" : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Got it
            </button>
          </div>
          <p>{beat.text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
