"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Mic, ShieldCheck, Square } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import type { PrecheckStatus } from "@/app/api/interview-session/types";
import { IdentityVerification } from "./identity-verification";

interface CandidatePrecheckProps {
  sessionId: string;
  token: string;
  candidateName: string;
  onContinue: () => void;
}

type PrecheckStep = "loading" | "consent" | "device" | "identity";

export function CandidatePrecheck({
  sessionId,
  token,
  candidateName,
  onContinue,
}: CandidatePrecheckProps) {
  const [step, setStep] = useState<PrecheckStep>("loading");
  const [status, setStatus] = useState<PrecheckStatus | null>(null);
  const [signatoryName, setSignatoryName] = useState(candidateName);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const routeFromStatus = (nextStatus: PrecheckStatus) => {
    setStatus(nextStatus);
    if (!nextStatus.candidate_consent_completed || !nextStatus.privacy_notice_acknowledged) {
      setStep("consent");
      return;
    }
    if (!nextStatus.device_check_completed || !nextStatus.verbal_confirmation_completed) {
      setStep("device");
      return;
    }
    if (!nextStatus.identity_verified) {
      setStep("identity");
      return;
    }
    onContinue();
  };

  useEffect(() => {
    let active = true;
    interviewSessionService
      .getPrecheckStatus(sessionId, token)
      .then((nextStatus) => {
        if (active) routeFromStatus(nextStatus);
      })
      .catch(() => {
        if (active) {
          setError("We could not load the required assessment checks. Please refresh and try again.");
          setStep("consent");
        }
      });
    return () => {
      active = false;
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // routeFromStatus intentionally uses the current onContinue callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  const submitConsent = async () => {
    if (!signatoryName.trim() || !consentAccepted || !privacyAccepted) {
      setError("Enter your full name and accept both acknowledgements to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let nextStatus = status;
      if (!status?.candidate_consent_completed) {
        nextStatus = await interviewSessionService.captureConsent(sessionId, token, signatoryName.trim());
      }
      if (!nextStatus?.privacy_notice_acknowledged) {
        nextStatus = await interviewSessionService.acknowledgePrivacy(sessionId, token);
      }
      if (!nextStatus) throw new Error("Consent status was not returned");
      routeFromStatus(nextStatus);
    } catch {
      setError("We could not record your consent. Please try again before starting the assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    setRecordingBlob(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot complete the microphone and camera check. Please use a current browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = stream;
      const audioStream = new MediaStream(stream.getAudioTracks());
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingBlob(blob);
        setRecording(false);
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Camera and microphone access is required. Allow access, then try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const submitDeviceChecks = async () => {
    if (!recordingBlob && !status?.verbal_confirmation_completed) {
      setError("Record the confirmation statement before continuing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let nextStatus = status;
      if (!status?.device_check_completed) {
        nextStatus = await interviewSessionService.completeDeviceCheck(sessionId, token, {
          camera: "available",
          microphone: "available",
          source: "candidate-precheck",
        });
      }
      if (!nextStatus?.verbal_confirmation_completed && recordingBlob) {
        const result = await interviewSessionService.submitVerbalConfirmation(sessionId, token, recordingBlob);
        nextStatus = result.precheck_status;
      }
      if (!nextStatus) throw new Error("Precheck status was not returned");
      routeFromStatus(nextStatus);
    } catch {
      setError("We could not complete the device and verbal confirmation checks. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const finishIdentity = async () => {
    setError(null);
    try {
      const nextStatus = await interviewSessionService.getPrecheckStatus(sessionId, token);
      if (!nextStatus.candidate_prechecks_complete) {
        routeFromStatus(nextStatus);
        setError("All required checks must be completed before the assessment can start.");
        return;
      }
      onContinue();
    } catch {
      setError("We could not verify the completed checks. Please try again.");
    }
  };

  if (step === "loading") {
    return (
      <PrecheckCard>
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
        <h1 className="text-xl font-bold text-slate-900">Preparing your assessment</h1>
        <p className="mt-2 text-sm text-slate-600">Checking the required consent and verification steps.</p>
      </PrecheckCard>
    );
  }

  if (step === "identity") {
    return <IdentityVerification sessionId={sessionId} token={token} onContinue={finishIdentity} />;
  }

  if (step === "consent") {
    return (
      <PrecheckCard>
        <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-blue-600" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Step 1 of 3</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Consent and privacy</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review and accept these terms before the Workforce Readiness Assessment begins.
        </p>

        <div className="mt-6 space-y-4 text-left">
          <label className="block text-sm font-semibold text-slate-700">
            Full legal name
            <input
              value={signatoryName}
              onChange={(event) => setSignatoryName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              autoComplete="name"
            />
          </label>
          <CheckRow checked={consentAccepted} onChange={setConsentAccepted}>
            I consent to the MeritLense Workforce Readiness Assessment and the processing of my assessment responses.
          </CheckRow>
          <CheckRow checked={privacyAccepted} onChange={setPrivacyAccepted}>
            I acknowledge the privacy notice and understand how my information is used for this assessment.
          </CheckRow>
        </div>

        <ErrorMessage message={error} />
        <PrimaryButton disabled={submitting} onClick={submitConsent}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Record consent and continue
        </PrimaryButton>
      </PrecheckCard>
    );
  }

  return (
    <PrecheckCard>
      <Mic className="mx-auto mb-3 h-12 w-12 text-cyan-600" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Step 2 of 3</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Device and verbal confirmation</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Allow camera and microphone access, then say: "I confirm that I am completing this assessment myself."
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="mx-auto flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Square className="h-4 w-4 fill-current" /> Stop recording
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="mx-auto flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Mic className="h-4 w-4" /> {recordingBlob ? "Record again" : "Start device check"}
          </button>
        )}
        {recordingBlob && !recording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Confirmation recorded
          </div>
        )}
      </div>

      <ErrorMessage message={error} />
      <PrimaryButton disabled={submitting || recording || (!recordingBlob && !status?.verbal_confirmation_completed)} onClick={submitDeviceChecks}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Complete checks and continue
      </PrimaryButton>
    </PrecheckCard>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3.5 text-sm leading-5 text-slate-700 hover:border-blue-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
      />
      <span>{children}</span>
    </label>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">{message}</div>;
}

function PrimaryButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function PrecheckCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#eff6ff_0,#f8fafc_48%,#eef2f7_100%)] p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white bg-white p-7 text-center shadow-xl shadow-slate-200/60 sm:p-9">
        {children}
      </div>
    </div>
  );
}
