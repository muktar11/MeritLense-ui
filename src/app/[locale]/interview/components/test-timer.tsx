"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { getCandidateStrings } from "../candidate-lang";

// Warning thresholds, each fired at most once as remainingSeconds crosses
// it on the way down - a plain `<=` check alone would re-fire every tick
// while under the threshold, hence the fired-ref guards below.
const WARNING_THRESHOLDS_SECONDS = [300, 60, 30] as const;

interface TestTimerProps {
  startedAt: string;
  durationMinutes: number;
  onTimeUp: () => void;
  uiLanguage?: string | null;
}

// The deadline is a fixed point in time derived from the server-persisted
// started_at, not "durationMinutes from when this component mounted" - so
// a page reload recomputes the exact same deadline instead of granting a
// fresh full duration.
export function TestTimer({ startedAt, durationMinutes, onTimeUp, uiLanguage }: TestTimerProps) {
  const t = getCandidateStrings(uiLanguage).testTimer;
  const deadlineRef = useRef(new Date(startedAt).getTime() + durationMinutes * 60_000);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
  );
  const hasFiredRef = useRef(false);
  // Thresholds already passed by the time this mounts (e.g. a page reload
  // with 45s left) are pre-marked as fired, so a reload doesn't dump every
  // skipped warning as a stale toast burst - only thresholds actually
  // crossed live, during this mount, notify.
  const firedWarningsRef = useRef(
    new Set(WARNING_THRESHOLDS_SECONDS.filter((threshold) => remainingSeconds <= threshold))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      for (const threshold of WARNING_THRESHOLDS_SECONDS) {
        if (remaining <= threshold && !firedWarningsRef.current.has(threshold)) {
          firedWarningsRef.current.add(threshold);
          const message =
            threshold === 300 ? t.warning5Min : threshold === 60 ? t.warning1Min : t.warning30Sec;
          if (threshold === 30) {
            toast.error(message);
          } else {
            toast.warning(message);
          }
        }
      }

      if (remaining <= 0 && !hasFiredRef.current) {
        hasFiredRef.current = true;
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);
    return () => clearInterval(interval);
    // onTimeUp is expected to be stable (wrapped in useCallback by the
    // caller) - re-running this effect on every render would reset the
    // interval needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const low = remainingSeconds <= 120; // last 2 minutes - a gentle amber cue, distinct from the red integrity warnings
  const critical = remainingSeconds <= 10; // final countdown - red and pulsing, same digits the badge already shows each tick

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border shrink-0 transition-colors ${
        critical
          ? "bg-red-50 border-red-300 text-red-700 animate-pulse"
          : low
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-white border-gray-200 text-gray-700"
      }`}
    >
      <Clock className="w-4 h-4" />
      <span className={critical ? "text-base font-bold tabular-nums" : "tabular-nums"}>
        {critical ? seconds : t.remaining(minutes, seconds.toString().padStart(2, "0"))}
      </span>
    </div>
  );
}
