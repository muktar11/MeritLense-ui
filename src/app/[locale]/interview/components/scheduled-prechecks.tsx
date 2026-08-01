"use client";

import { useEffect, useRef, useState } from "react";
import {
  KeyRound,
  FileText,
  ShieldCheck,
  Camera,
  Mic,
  Square,
  RotateCcw,
  Loader2,
  Send,
  CheckCircle2,
} from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";

interface ScheduledPrechecksProps {
  sessionId: string;
  token: string;
  onContinue: () => void;
}

// Order matches what was asked for: password first (proves the opener has
// access to the candidate's inbox, replacing the camera-based identity
// check that isn't practical for a link opened well ahead of its scheduled
// time - see the backend's verify_access_password), then the rest of the
// precheck battery, which previously had no candidate-facing UI at all.
type Step = "password" | "consent" | "privacy" | "device-check" | "verbal-confirmation" | "done";

const STEP_ORDER: Step[] = ["password", "consent", "privacy", "device-check", "verbal-confirmation", "done"];

export function ScheduledPrechecks({ sessionId, token, onContinue }: ScheduledPrechecksProps) {
  const [step, setStep] = useState<Step>("password");

  const advance = () => {
    const index = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[index + 1] ?? "done";
    if (next === "done") {
      onContinue();
    } else {
      setStep(next);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-lg w-full">
        <StepIndicator step={step} />
        {step === "password" && <PasswordStep sessionId={sessionId} token={token} onDone={advance} />}
        {step === "consent" && <ConsentStep sessionId={sessionId} token={token} onDone={advance} />}
        {step === "privacy" && <PrivacyStep sessionId={sessionId} token={token} onDone={advance} />}
        {step === "device-check" && <DeviceCheckStep sessionId={sessionId} token={token} onDone={advance} />}
        {step === "verbal-confirmation" && (
          <VerbalConfirmationStep sessionId={sessionId} token={token} onDone={advance} />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const index = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length - 1; // exclude "done"
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {STEP_ORDER.slice(0, total).map((s, i) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-colors ${
            i <= index ? "bg-purple-600" : "bg-gray-200"
          } ${i === index ? "w-6" : "w-3"}`}
        />
      ))}
    </div>
  );
}

function PasswordStep({
  sessionId,
  token,
  onDone,
}: {
  sessionId: string;
  token: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await interviewSessionService.verifyAccessPassword(sessionId, token, password.trim());
      onDone();
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Incorrect password. Please check the email and try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <KeyRound className="w-12 h-12 text-purple-500 mx-auto mb-1" />
      <h1 className="text-xl font-bold text-gray-900">Enter your access password</h1>
      <p className="text-gray-600 text-sm">
        We emailed you a 6-digit password along with your interview link. Enter it below to confirm it&apos;s you.
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm text-left">
          {error}
        </div>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading || password.trim().length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}

function ConsentStep({
  sessionId,
  token,
  onDone,
}: {
  sessionId: string;
  token: string;
  onDone: () => void;
}) {
  const [signatoryName, setSignatoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatoryName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await interviewSessionService.captureConsent(sessionId, token, signatoryName.trim());
      onDone();
    } catch {
      setError("Something went wrong recording your consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FileText className="w-12 h-12 text-purple-500 mx-auto mb-1" />
      <h1 className="text-xl font-bold text-gray-900">Candidate consent</h1>
      <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-2 max-h-48 overflow-y-auto">
        <p>By continuing, you confirm that:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>You are the candidate this interview was scheduled for.</li>
          <li>You consent to being interviewed by MeritLense&apos;s AI interview system.</li>
          <li>Your responses, and where applicable audio/video from this session, may be recorded and used for evaluation.</li>
          <li>You can contact the person who invited you with any questions before proceeding.</li>
        </ul>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm text-left">
          {error}
        </div>
      )}
      <div className="text-left">
        <label className="block text-sm font-medium text-gray-700 mb-1">Type your full legal name to sign</label>
        <input
          type="text"
          value={signatoryName}
          onChange={(e) => setSignatoryName(e.target.value)}
          placeholder="Full name"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading || signatoryName.trim().length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Saving…" : "I Agree & Continue"}
      </button>
    </form>
  );
}

function PrivacyStep({
  sessionId,
  token,
  onDone,
}: {
  sessionId: string;
  token: string;
  onDone: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!acknowledged) return;
    setLoading(true);
    setError(null);
    try {
      await interviewSessionService.acknowledgePrivacy(sessionId, token);
      onDone();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ShieldCheck className="w-12 h-12 text-purple-500 mx-auto mb-1" />
      <h1 className="text-xl font-bold text-gray-900">Privacy notice</h1>
      <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-2 max-h-48 overflow-y-auto">
        <p>
          MeritLense collects your responses and identifying information solely to evaluate your candidacy for the
          role you applied for. Your data is shared only with the organization that invited you and is retained
          according to their evaluation and record-keeping needs.
        </p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm text-left">
          {error}
        </div>
      )}
      <label className="flex items-start gap-2 text-left text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5"
        />
        I have read and understand this privacy notice.
      </label>
      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !acknowledged}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}

function DeviceCheckStep({
  sessionId,
  token,
  onDone,
}: {
  sessionId: string;
  token: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "testing" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleTest = async () => {
    setStatus("testing");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setStatus("ready");
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setStatus("error");
      setError("Couldn't access your camera and microphone. Please allow access in your browser and try again.");
    }
  };

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      await interviewSessionService.completeDeviceCheck(sessionId, token, true);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onDone();
    } catch {
      setError("Something went wrong saving your device check. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Camera className="w-12 h-12 text-purple-500 mx-auto mb-1" />
      <h1 className="text-xl font-bold text-gray-900">Device check</h1>
      <p className="text-gray-600 text-sm">
        Let&apos;s confirm your camera and microphone work before the interview begins.
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm text-left">
          {error}
        </div>
      )}

      {status === "ready" ? (
        <div className="rounded-lg overflow-hidden bg-gray-100 aspect-video border border-gray-200">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-lg bg-gray-100 aspect-video border border-gray-200 flex items-center justify-center text-gray-400">
          {status === "testing" ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
        </div>
      )}

      {status !== "ready" ? (
        <button
          type="button"
          onClick={handleTest}
          disabled={status === "testing"}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {status === "testing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {status === "testing" ? "Testing…" : status === "error" ? "Retry" : "Test Camera & Microphone"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleContinue}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {submitting ? "Saving…" : "Looks Good, Continue"}
        </button>
      )}
    </div>
  );
}

function VerbalConfirmationStep({
  sessionId,
  token,
  onDone,
}: {
  sessionId: string;
  token: string;
  onDone: () => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "recorded" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setState("recording");
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
    setSubmitting(true);
    setError(null);
    try {
      await interviewSessionService.submitVerbalConfirmation(sessionId, token, blobRef.current);
      onDone();
    } catch {
      setError("Something went wrong submitting your recording. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Mic className="w-12 h-12 text-purple-500 mx-auto mb-1" />
      <h1 className="text-xl font-bold text-gray-900">Verbal confirmation</h1>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        Please record yourself saying:
        <p className="mt-2 font-medium italic">
          &quot;I confirm that I am the candidate scheduled for this interview, and I consent to participating.&quot;
        </p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm text-left">
          {error}
        </div>
      )}

      {(state === "idle" || state === "error") && (
        <button
          type="button"
          onClick={handleRecord}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50"
        >
          <Mic className="w-8 h-8" />
          <span className="text-sm font-medium">Tap to record</span>
        </button>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-purple-400 rounded-lg bg-purple-50">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Recording…</span>
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
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
