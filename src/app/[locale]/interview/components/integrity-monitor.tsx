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

const CHECK_INTERVAL_MS = 45_000;

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

export function IntegrityMonitor({ sessionId, token, onSessionStatusChange }: IntegrityMonitorProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
              // Still unavailable - fall through and report it below.
            }
          }

          const el = videoRef.current;
          const cameraUnavailable =
            !track ||
            track.readyState !== "live" ||
            !el ||
            el.videoWidth === 0 ||
            isFrameEssentiallyBlack(el);

          try {
            if (cameraUnavailable) {
              // Distinct from - and treated more seriously than - a brief
              // "no face" reading: the camera being off entirely means
              // nothing is being observed at all, so unlike a momentary
              // "stepped out of frame" this counts toward termination the
              // same way a second person in frame does (see backend
              // _apply_integrity_escalation).
              setWarning("Your camera appears to be off or unavailable — this counts as an integrity violation.");
              const result = await interviewSessionService.logIntegrityEvent(sessionId, token, {
                eventType: "CAMERA_UNAVAILABLE",
                severity: "WARNING",
                singleFaceDetected: false,
                faceCount: 0,
              });
              if (!active) return;
              onSessionStatusChange?.(result.session_status);
              if (result.session_status === "FAILED") {
                if (intervalRef.current) clearInterval(intervalRef.current);
                streamRef.current?.getTracks().forEach((t) => t.stop());
              }
              return;
            }

            const detections = await faceapi.detectAllFaces(el, new faceapi.TinyFaceDetectorOptions());
            const faceCount = detections.length;
            const singleFaceDetected = faceCount === 1;

            if (!active) return;
            if (faceCount === 0) {
              setWarning("We can't see you — please make sure you're visible to the camera.");
            } else if (faceCount > 1) {
              setWarning("Multiple faces detected — please make sure you're alone.");
            } else {
              setWarning(null);
            }

            const result = await interviewSessionService.logIntegrityEvent(sessionId, token, {
              singleFaceDetected,
              faceCount,
            });
            if (!active) return;
            onSessionStatusChange?.(result.session_status);
            if (result.session_status === "FAILED") {
              // Nothing left to monitor - the session is over.
              if (intervalRef.current) clearInterval(intervalRef.current);
              streamRef.current?.getTracks().forEach((t) => t.stop());
            }
          } catch {
            // Silently skip a failed check - this is a best-effort, non-blocking
            // monitor; one missed frame shouldn't interrupt the interview.
          }
        }, CHECK_INTERVAL_MS);
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
      {warning && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-sm shadow-md max-w-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
      <div
        className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 shadow-lg bg-black ${
          warning ? "border-amber-400" : "border-white"
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
