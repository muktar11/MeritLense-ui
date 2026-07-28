"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import { ensureModelsLoaded } from "./face-detection";
import type { SessionStatus } from "@/app/api/interview-session/types";

interface IntegrityMonitorProps {
  sessionId: string;
  token: string;
  onSessionStatusChange?: (status: SessionStatus) => void;
}

const CHECK_INTERVAL_MS = 45_000;

export function IntegrityMonitor({ sessionId, token, onSessionStatusChange }: IntegrityMonitorProps) {
  const [warning, setWarning] = useState<string | null>(null);

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

        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        await video.play();
        videoRef.current = video;

        intervalRef.current = setInterval(async () => {
          const el = videoRef.current;
          if (!el || el.videoWidth === 0) return;
          try {
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

  if (!warning) return null;

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{warning}</span>
    </div>
  );
}
