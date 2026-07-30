"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import { ensureModelsLoaded } from "@/lib/face-detection";
import type { SessionStatus } from "@/app/api/interview-session/types";

interface IntegrityMonitorProps {
  sessionId: string;
  token: string;
  onSessionStatusChange?: (status: SessionStatus) => void;
}

// Local-only cadence for watching the camera/face state and driving the
// grace-period countdown below - decoupled from how often we actually
// report to the backend (REPORT_INTERVAL_MS), so a problem starting gets
// noticed within a couple of seconds without hammering the API every
// couple of seconds for the whole interview.
const WATCH_INTERVAL_MS = 2_000;
// Steady-state "everything's fine" heartbeat cadence - keeps the backend's
// paused-session auto-resume check current without reporting on every
// single watch tick.
const REPORT_INTERVAL_MS = 45_000;
// How long a newly-detected problem (no face, second person, camera
// blocked) has to resolve itself before it's actually reported and counted
// as a violation - long enough that briefly adjusting your seat, glancing
// away, or a one-frame camera glitch doesn't get punished, short enough to
// still be a real deterrent.
const GRACE_PERIOD_SECONDS = 10;

// A camera blocked at the OS level (e.g. Windows' camera-privacy toggle) or
// physically covered can keep delivering a "live" track and non-zero video
// dimensions while every actual frame is solid black - technically
// indistinguishable from a working camera by track.readyState/videoWidth
// alone. Sampling the frame's average brightness catches this: a real room,
// even dimly lit, has far more variation than a deliberately blanked feed.
// Conservative (near-pure-black) specifically so normal low light doesn't
// misfire.
const BLACK_FRAME_BRIGHTNESS_THRESHOLD = 8;

function isFrameEssentiallyBlack(el: HTMLVideoElement): boolean {
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false; // can't evaluate - don't false-positive
  ctx.drawImage(el, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let sum = 0;
  const pixelCount = size * size;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / pixelCount < BLACK_FRAME_BRIGHTNESS_THRESHOLD;
}

type ProblemType = "NO_FACE_DETECTED" | "MULTIPLE_FACES_DETECTED" | "CAMERA_UNAVAILABLE";

const PROBLEM_LABELS: Record<ProblemType, string> = {
  NO_FACE_DETECTED: "We can't see you",
  MULTIPLE_FACES_DETECTED: "Multiple faces detected",
  CAMERA_UNAVAILABLE: "Your camera appears to be off or unavailable",
};

export function IntegrityMonitor({ sessionId, token, onSessionStatusChange }: IntegrityMonitorProps) {
  const [graceCountdown, setGraceCountdown] = useState<{ type: ProblemType; secondsLeft: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReportAtRef = useRef<number>(0);
  const needsImmediateOkReportRef = useRef(false);
  const graceProblemRef = useRef<{ type: ProblemType; secondsLeft: number } | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const faceapi = await ensureModelsLoaded();
        if (!active) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraReady(true);
        // videoRef only mounts once cameraReady flips true, so attach on
        // the next tick once the element actually exists.
        requestAnimationFrame(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        });

        const reportProblem = async (type: ProblemType, faceCount: number) => {
          needsImmediateOkReportRef.current = true;
          try {
            const result = await interviewSessionService.logIntegrityEvent(sessionId, token, {
              eventType: type,
              severity: "WARNING",
              singleFaceDetected: false,
              faceCount,
            });
            lastReportAtRef.current = Date.now();
            if (!active) return;
            onSessionStatusChange?.(result.session_status);
            if (result.session_status === "FAILED") {
              if (intervalRef.current) clearInterval(intervalRef.current);
              streamRef.current?.getTracks().forEach((t) => t.stop());
            }
          } catch {
            // best-effort
          }
        };

        const reportOk = async (faceCount: number) => {
          try {
            const result = await interviewSessionService.logIntegrityEvent(sessionId, token, {
              singleFaceDetected: faceCount === 1,
              faceCount,
            });
            lastReportAtRef.current = Date.now();
            needsImmediateOkReportRef.current = false;
            if (!active) return;
            onSessionStatusChange?.(result.session_status);
          } catch {
            // best-effort
          }
        };

        intervalRef.current = setInterval(async () => {
          if (!active) return;

          // If the stream has died (camera turned off, permission revoked,
          // device disconnected) since the last check, try to get it back
          // before anything else - a candidate re-enabling their camera
          // should be able to auto-resume, the same way stepping back into
          // frame already does for a soft "no face" reading.
          let track = streamRef.current?.getVideoTracks()[0];
          if (!track || track.readyState !== "live") {
            try {
              const freshStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
              if (!active) {
                freshStream.getTracks().forEach((t) => t.stop());
                return;
              }
              streamRef.current?.getTracks().forEach((t) => t.stop());
              streamRef.current = freshStream;
              track = freshStream.getVideoTracks()[0];
              if (videoRef.current) videoRef.current.srcObject = freshStream;
            } catch {
              // Still unavailable - falls through to CAMERA_UNAVAILABLE below.
            }
          }

          const el = videoRef.current;
          let problemType: ProblemType | null = null;
          let faceCount = 0;

          try {
            if (!track || track.readyState !== "live" || !el || el.videoWidth === 0 || (el && isFrameEssentiallyBlack(el))) {
              problemType = "CAMERA_UNAVAILABLE";
            } else {
              const detections = await faceapi.detectAllFaces(el, new faceapi.TinyFaceDetectorOptions());
              faceCount = detections.length;
              if (faceCount === 0) problemType = "NO_FACE_DETECTED";
              else if (faceCount > 1) problemType = "MULTIPLE_FACES_DETECTED";
            }
          } catch {
            return; // best-effort - skip this tick entirely on an unexpected error
          }

          if (!active) return;

          if (problemType) {
            const current = graceProblemRef.current;
            if (!current || current.type !== problemType) {
              // A brand new problem, or a switch from one problem to a
              // different one (e.g. camera comes back but now shows a
              // second person) - start a fresh grace countdown rather than
              // reporting immediately.
              graceProblemRef.current = { type: problemType, secondsLeft: GRACE_PERIOD_SECONDS };
              setGraceCountdown({ type: problemType, secondsLeft: GRACE_PERIOD_SECONDS });
            } else {
              const secondsLeft = current.secondsLeft - 1;
              if (secondsLeft <= 0) {
                graceProblemRef.current = null;
                setGraceCountdown(null);
                await reportProblem(problemType, faceCount);
              } else {
                current.secondsLeft = secondsLeft;
                setGraceCountdown({ type: problemType, secondsLeft });
              }
            }
            return;
          }

          // All clear - cancel any in-progress grace countdown (the
          // candidate self-corrected before it ever counted against them).
          if (graceProblemRef.current) {
            graceProblemRef.current = null;
            setGraceCountdown(null);
          }

          // Report immediately if we just reported a problem (so a paused
          // session can auto-resume as soon as possible), otherwise stick
          // to the normal steady-state heartbeat cadence.
          if (needsImmediateOkReportRef.current || Date.now() - lastReportAtRef.current >= REPORT_INTERVAL_MS) {
            await reportOk(faceCount);
          }
        }, WATCH_INTERVAL_MS);
      } catch {
        // Camera unavailable or permission denied for the monitor - this is a
        // soft, best-effort feature, so fail silently rather than blocking
        // or alarming the candidate mid-interview.
      }
    })();

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  if (!cameraReady) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {graceCountdown && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm shadow-md max-w-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {PROBLEM_LABELS[graceCountdown.type]} — this will be flagged as an integrity violation in{" "}
            {graceCountdown.secondsLeft}s unless resolved.
          </span>
        </div>
      )}
      <div
        className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 shadow-lg bg-black ${
          graceCountdown ? "border-red-500" : "border-white"
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
