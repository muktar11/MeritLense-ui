"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Mic,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Video,
} from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import type { PrecheckStatus } from "@/app/api/interview-session/types";
import { IdentityVerification } from "./identity-verification";

interface PrecheckFlowProps {
  sessionId: string;
  token: string;
  onContinue: () => void;
  // Scheduled sessions route through this same precheck gate before
  // entering the live call room (see interview/page.tsx's
  // resolveSessionState) - candidates otherwise have no way to tell this
  // apart from a solo AI interview's identical-looking prechecks.
  isLiveCall?: boolean;
}

type Step = "loading" | "privacy" | "device-check" | "verbal-confirmation" | "identity";

const VERBAL_CONFIRMATION_PHRASE =
  "I confirm that I am the person completing this interview and that my answers are my own.";

const VERBAL_CONFIRMATION_MAX_SECONDS = 15;

export function PrecheckFlow({ sessionId, token, onContinue, isLiveCall }: PrecheckFlowProps) {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await interviewSessionService.getPrecheckStatus(sessionId, token);
        if (!active) return;
        setStep(nextIncompleteStep(status));
      } catch {
        // Status couldn't be read - start from the beginning rather than
        // blocking the candidate entirely; each step's own submit call
        // will surface a real error if something is still wrong.
        if (active) setStep("privacy");
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId, token]);

  let content: ReactNode;

  if (step === "loading") {
    content = (
      <CenteredCard>
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-gray-600">Preparing your interview…</p>
      </CenteredCard>
    );
  } else if (step === "privacy") {
    content = (
      <PrivacyStep
        error={error}
        onError={setError}
        onSubmit={async () => {
          await interviewSessionService.acknowledgePrivacy(sessionId, token);
          setError(null);
          setStep("device-check");
        }}
      />
    );
  } else if (step === "device-check") {
    content = (
      <DeviceCheckStep
        error={error}
        onError={setError}
        onSubmit={async () => {
          await interviewSessionService.completeDeviceCheck(sessionId, token, true, {
            camera: "ok",
            microphone: "ok",
            source: "candidate-precheck",
          });
          setError(null);
          setStep("verbal-confirmation");
        }}
      />
    );
  } else if (step === "verbal-confirmation") {
    content = (
      <VerbalConfirmationStep
        error={error}
        onError={setError}
        onSubmit={async (blob) => {
          await interviewSessionService.submitVerbalConfirmation(sessionId, token, blob);
          setError(null);
          setStep("identity");
        }}
      />
    );
  } else {
    content = <IdentityVerification sessionId={sessionId} token={token} onContinue={onContinue} />;
  }

  if (!isLiveCall) return content;

  return (
    <div>
      <div className="bg-purple-700 text-white text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 text-center">
        <Video className="w-4 h-4 shrink-0" />
        Live interview — you&apos;ll join a video call with your evaluator once you&apos;re ready
      </div>
      {content}
    </div>
  );
}

function nextIncompleteStep(status: PrecheckStatus): Step {
  if (!status.privacy_notice_acknowledged) return "privacy";
  if (!status.device_check_completed) return "device-check";
  if (!status.verbal_confirmation_completed) return "verbal-confirmation";
  return "identity";
}

function PrivacyStep({
  error,
  onError,
  onSubmit,
}: {
  error: string | null;
  onError: (message: string | null) => void;
  onSubmit: () => Promise<void>;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!acknowledged || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit();
    } catch {
      onError("Something went wrong saving your acknowledgement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CenteredCard wide>
      <ShieldCheck className="w-12 h-12 text-purple-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Privacy Notice</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 text-left">
          {error}
        </div>
      )}

      <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm text-gray-700 space-y-3">
        <p>
          MeritLense collects and processes your spoken and/or written responses (including audio recordings and
          transcripts where you answer by voice), a photo captured for identity verification, and the scores,
          indicators, and other outputs our AI-assisted analysis generates from your responses. If your session
          includes a live video interview, the call itself is not recorded &mdash; only your spoken responses are
          transcribed for evaluation.
        </p>
        <p>
          This data is used to verify your identity, conduct your workforce-readiness assessment, analyze your
          responses and competency performance, and generate your assessment report and, where applicable, a
          certificate.
        </p>
        <p>
          Some parts of this assessment use AI and automated analysis to transcribe, translate, and evaluate your
          responses. Results are decision-support information, not a final decision &mdash; the employer or
          organization that invited you to this assessment remains solely responsible for any hiring decision.
        </p>
        <p>
          MeritLense does not sell your data. Authorized service providers (for example, speech-to-text,
          translation, and AI-analysis providers) may process your data only as necessary to deliver this assessment
          service, under appropriate data-protection safeguards. Your results are also shared with the employer or
          agency that requested this assessment.
        </p>
        <p>Your data is retained according to MeritLense&apos;s data retention policy.</p>
      </div>

      <label className="flex items-start gap-2 text-left text-sm text-gray-700 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I confirm that I have read and understood this Privacy Notice and acknowledge that my personal data,
          including video, audio, transcripts and identity-verification information, will be processed for the
          purposes described above.
        </span>
      </label>

      <button
        type="button"
        disabled={!acknowledged || submitting}
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Acknowledge & Continue
      </button>
    </CenteredCard>
  );
}

function DeviceCheckStep({
  error,
  onError,
  onSubmit,
}: {
  error: string | null;
  onError: (message: string | null) => void;
  onSubmit: () => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "checking" | "passed" | "failed">("idle");
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const runCheck = async () => {
    setState("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const hasVideo = stream.getVideoTracks().some((t) => t.readyState === "live");
      const hasAudio = stream.getAudioTracks().some((t) => t.readyState === "live");
      streamRef.current = stream;
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
      setState(hasVideo && hasAudio ? "passed" : "failed");
    } catch {
      setState("failed");
    }
  };

  const handleContinue = async () => {
    setSubmitting(true);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      await onSubmit();
    } catch {
      onError("Something went wrong saving your device check. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CenteredCard wide>
      <Camera className="w-12 h-12 text-purple-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Camera & Microphone Check</h1>
      <p className="text-gray-600 text-sm mb-4">
        We need to confirm your camera and microphone both work before you begin.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 text-left">
          {error}
        </div>
      )}

      {state === "idle" && (
        <button
          type="button"
          onClick={runCheck}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          <Camera className="w-4 h-4" /> Test Camera & Microphone
        </button>
      )}

      {state === "checking" && (
        <div className="flex flex-col items-center gap-2 text-sm text-gray-600 py-4">
          <Loader2 className="w-6 h-6 animate-spin" /> Checking devices…
        </div>
      )}

      {state === "passed" && (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Camera and microphone are working.</span>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continue
          </button>
        </div>
      )}

      {state === "failed" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              We couldn&apos;t access both your camera and microphone. Please allow access to both and try again.
            </span>
          </div>
          <button
            type="button"
            onClick={runCheck}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}
    </CenteredCard>
  );
}

function VerbalConfirmationStep({
  error,
  onError,
  onSubmit,
}: {
  error: string | null;
  onError: (message: string | null) => void;
  onSubmit: (blob: Blob) => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "recording" | "recorded" | "submitting">("idle");
  const [countdown, setCountdown] = useState(VERBAL_CONFIRMATION_MAX_SECONDS);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    mediaRecorderRef.current?.stop();
  };

  const startRecording = async () => {
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
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setState("recorded");
      };
      recorder.start();
      setState("recording");
      setCountdown(VERBAL_CONFIRMATION_MAX_SECONDS);
      const startedAt = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = VERBAL_CONFIRMATION_MAX_SECONDS - elapsed;
        if (remaining <= 0) {
          stopRecording();
        } else {
          setCountdown(remaining);
        }
      }, 250);
    } catch {
      setState("idle");
    }
  };

  const handleRetry = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    blobRef.current = null;
    setState("idle");
  };

  const handleSubmit = async () => {
    if (!blobRef.current) return;
    setState("submitting");
    try {
      await onSubmit(blobRef.current);
    } catch {
      onError("Something went wrong submitting your recording. Please try again.");
      setState("recorded");
    }
  };

  return (
    <CenteredCard wide>
      <Mic className="w-12 h-12 text-purple-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Verbal Confirmation</h1>
      <p className="text-gray-600 text-sm mb-4">Please read the following out loud and record yourself saying it:</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 text-left">
          {error}
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 text-sm font-medium text-purple-900">
        &ldquo;{VERBAL_CONFIRMATION_PHRASE}&rdquo;
      </div>

      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          <Mic className="w-4 h-4" /> Start Recording
        </button>
      )}

      {state === "recording" && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-red-600 font-medium py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Recording… {countdown}s
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium"
          >
            <Square className="w-4 h-4" /> Stop Recording
          </button>
        </div>
      )}

      {(state === "recorded" || state === "submitting") && audioUrl && (
        <div className="space-y-3">
          <audio controls src={audioUrl} className="w-full">
            <track kind="captions" />
          </audio>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={state === "submitting"}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Re-record
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={state === "submitting"}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
            >
              {state === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Submit & Continue
            </button>
          </div>
        </div>
      )}
    </CenteredCard>
  );
}

function CenteredCard({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${wide ? "max-w-lg w-full" : "max-w-md"}`}>
        {children}
      </div>
    </div>
  );
}
