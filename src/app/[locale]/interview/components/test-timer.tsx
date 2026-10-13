"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { getCandidateStrings, resolveCandidateLanguage } from "../candidate-lang";
import { getLanguageStrings } from "../language-strings";

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
  const tl = getLanguageStrings(resolveCandidateLanguage(uiLanguage));
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

  const totalSeconds = durationMinutes * 60;
  const fmt = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
  const low = remainingSeconds <= 120; // last 2 minutes - amber
  const critical = remainingSeconds <= 30; // final seconds - red
  const percentLeft = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;
  const tone = critical ? "text-red-700" : low ? "text-amber-700" : "text-gray-900";
  const bar = critical ? "bg-red-500" : low ? "bg-amber-500" : "bg-purple-600";

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`${tl.timeRemaining}: ${fmt(remainingSeconds)}`}
      className={`flex min-w-[15rem] items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
        critical ? "border-red-200 bg-red-50" : low ? "border-amber-200 bg-amber-50" : "border-purple-100 bg-purple-50/70"
      }`}
    >
      <Clock className={`h-6 w-6 shrink-0 ${critical ? "text-red-600" : low ? "text-amber-600" : "text-purple-600"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-600">{tl.timeRemaining}</p>
        <p className={`font-bold tabular-nums ${tone} ${critical ? "animate-pulse" : ""}`} dir="ltr">
          <span className="text-2xl">{fmt(remainingSeconds)}</span>
          <span className="ms-1 text-sm font-medium text-gray-500">/ {fmt(totalSeconds)}</span>
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/80" dir="ltr">
          <div className={`h-full ${bar} transition-[width] duration-1000 ease-linear`} style={{ width: `${percentLeft}%` }} />
        </div>
      </div>
      <p className="hidden max-w-[9rem] border-s border-purple-200 ps-3 text-xs leading-snug text-gray-500 lg:block">
        {tl.timeContinues}
      </p>
    </div>
  );
}
