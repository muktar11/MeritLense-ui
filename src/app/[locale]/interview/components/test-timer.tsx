"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface TestTimerProps {
  startedAt: string;
  durationMinutes: number;
  onTimeUp: () => void;
}

// The deadline is a fixed point in time derived from the server-persisted
// started_at, not "durationMinutes from when this component mounted" - so
// a page reload recomputes the exact same deadline instead of granting a
// fresh full duration.
export function TestTimer({ startedAt, durationMinutes, onTimeUp }: TestTimerProps) {
  const deadlineRef = useRef(new Date(startedAt).getTime() + durationMinutes * 60_000);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
  );
  const hasFiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
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

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border shrink-0 ${
        low ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-gray-200 text-gray-700"
      }`}
    >
      <Clock className="w-4 h-4" />
      <span>
        {minutes}:{seconds.toString().padStart(2, "0")} remaining
      </span>
    </div>
  );
}
