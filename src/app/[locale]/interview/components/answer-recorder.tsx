"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Loader2, Send } from "lucide-react";

interface AnswerRecorderProps {
  onSubmit: (blob: Blob, durationSeconds: number) => Promise<void>;
  submitting: boolean;
  submitLabel: string;
}

type RecorderState = "idle" | "recording" | "recorded" | "error";

export function AnswerRecorder({ onSubmit, submitting, submitLabel }: AnswerRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecord = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setState("recorded");
        stopTimer();
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setState("recording");
      startTimer();
    } catch {
      setError("Couldn't access your microphone. Please allow microphone access and try again.");
      setState("error");
    }
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleReRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    setState("idle");
  };

  const handleSubmit = async () => {
    if (!blobRef.current) return;
    await onSubmit(blobRef.current, elapsedSeconds);
    handleReRecord();
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      {state === "idle" || state === "error" ? (
        <button
          type="button"
          onClick={handleRecord}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50"
        >
          <Mic className="w-8 h-8" />
          <span className="text-sm font-medium">Tap to record your answer</span>
        </button>
      ) : null}

      {state === "recording" && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-purple-400 rounded-lg bg-purple-50">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Recording… {formatTime(elapsedSeconds)}</span>
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        </div>
      )}

      {state === "recorded" && previewUrl && (
        <div className="space-y-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio className="w-full" src={previewUrl} controls />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReRecord}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" /> Re-record
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? submitLabel : "Submit Answer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
