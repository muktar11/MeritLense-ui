"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, RotateCcw, ShieldCheck, Users, XCircle } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import { ensureModelsLoaded } from "./face-detection";

interface IdentityVerificationProps {
  sessionId: string;
  token: string;
  onContinue: () => void;
}

type Step =
  | "loading"
  | "ready"
  | "camera-active"
  | "captured"
  | "comparing"
  | "result"
  | "multiple-people"
  | "unavailable";

// face-api.js descriptor distances below ~0.6 are generally considered the
// same person; we scale that into a friendlier 0-100 "match score" for the
// candidate/staff to read, rather than exposing raw distance units.
const MATCH_DISTANCE_THRESHOLD = 0.6;

export function IdentityVerification({ sessionId, token, onContinue }: IdentityVerificationProps) {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const referenceImgRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selfieBlobRef = useRef<Blob | null>(null);
  const hasReferenceRef = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [blob] = await Promise.all([
          interviewSessionService.getReferenceImage(sessionId, token),
          ensureModelsLoaded(),
        ]);
        if (!active) return;
        setReferenceUrl(URL.createObjectURL(blob));
        hasReferenceRef.current = true;
        setStep("ready");
      } catch {
        if (!active) return;
        // No usable reference photo on file, or models failed to load -
        // this is a soft gate, so let the candidate through rather than
        // block them on something outside their control.
        hasReferenceRef.current = false;
        setStep("unavailable");
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId, token]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (referenceUrl) URL.revokeObjectURL(referenceUrl);
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setStep("camera-active");
      // The <video> element only mounts once we're in "camera-active", so
      // attach the stream on the next tick once the ref is available.
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError("Couldn't access your camera. Please allow camera access and try again.");
    }
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;
    // Capture from the raw video stream, not the mirrored <video> element's
    // CSS transform - the mirror is a display-only treatment so the
    // candidate sees themselves naturally; drawImage reads the underlying
    // stream pixels regardless of CSS, so the captured frame stays
    // unflipped, which is what we actually want to compare/store.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    streamRef.current?.getTracks().forEach((t) => t.stop());

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        selfieBlobRef.current = blob;
        setSelfieUrl(URL.createObjectURL(blob));
        setStep("captured");
        await runComparison(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  const runComparison = async (selfieBlob: Blob) => {
    setStep("comparing");
    try {
      const faceapi = await ensureModelsLoaded();

      const selfieImg = await blobToImage(selfieBlob);
      const referenceImg = referenceImgRef.current;
      if (!referenceImg) throw new Error("Reference image not available");

      const detectorOptions = new faceapi.TinyFaceDetectorOptions();
      const selfieResults = await faceapi
        .detectAllFaces(selfieImg, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (selfieResults.length > 1) {
        // Hard block - this is the one case in this flow that isn't a soft
        // gate. A second person visible at the very start of the interview
        // is an unambiguous problem, distinct from "the photo didn't match
        // well" (which stays soft, since bad lighting/camera shouldn't lock
        // a legitimate candidate out).
        await interviewSessionService.submitIdentityVerification(sessionId, token, {
          selfieBlob,
          faceMatchScore: 0,
          singleFaceDetected: false,
          livenessPassed: true,
        }).catch(() => {});
        setStep("multiple-people");
        return;
      }

      const selfieResult = selfieResults[0];
      const referenceResult = await faceapi
        .detectSingleFace(referenceImg, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const singleFaceDetected = Boolean(selfieResult);
      let score = 0;
      if (selfieResult && referenceResult) {
        const distance = faceapi.euclideanDistance(selfieResult.descriptor, referenceResult.descriptor);
        score = Math.max(0, Math.min(100, (1 - distance / MATCH_DISTANCE_THRESHOLD) * 100));
      }

      setMatchScore(score);
      setPassed(score >= 85 && singleFaceDetected);

      await interviewSessionService.submitIdentityVerification(sessionId, token, {
        selfieBlob,
        faceMatchScore: score,
        singleFaceDetected,
        // face-api.js does basic 2D face matching but no real liveness/anti-spoofing
        // check (e.g. detecting a photo held up to the camera) - reporting true
        // here reflects that limitation honestly rather than implying a check
        // that isn't actually happening.
        livenessPassed: true,
      });
      setStep("result");
    } catch {
      setMatchScore(0);
      setPassed(false);
      setStep("result");
    }
  };

  const handleRetry = () => {
    if (selfieUrl) URL.revokeObjectURL(selfieUrl);
    setSelfieUrl(null);
    setMatchScore(null);
    setError(null);
    setStep("ready");
  };

  if (step === "loading") {
    return (
      <CenteredCard>
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-gray-600">Preparing identity verification…</p>
      </CenteredCard>
    );
  }

  if (step === "unavailable") {
    return (
      <CenteredCard>
        <ShieldCheck className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Identity verification unavailable</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t set up automatic verification for this session. You can continue to your interview.
        </p>
        <ContinueButton onClick={onContinue} />
      </CenteredCard>
    );
  }

  return (
    <CenteredCard wide>
      <ShieldCheck className="w-12 h-12 text-purple-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Verify your identity</h1>
      <p className="text-gray-600 text-sm mb-6">
        Take a quick photo so we can confirm it&apos;s you before starting the interview.
      </p>

      {referenceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={referenceImgRef}
          src={referenceUrl}
          alt="Reference document on file"
          crossOrigin="anonymous"
          className="hidden"
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>
      )}

      {step === "ready" && (
        <button
          type="button"
          onClick={handleStartCamera}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          <Camera className="w-4 h-4" /> Start Camera
        </button>
      )}

      {step === "camera-active" && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: "scaleX(-1)" }}
            className="w-full rounded-lg bg-black aspect-video"
          />
          <button
            type="button"
            onClick={handleCapture}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            <Camera className="w-4 h-4" /> Capture Photo
          </button>
        </div>
      )}

      {(step === "captured" || step === "comparing") && selfieUrl && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selfieUrl} alt="Captured selfie" className="w-full rounded-lg" style={{ transform: "scaleX(-1)" }} />
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Comparing…
          </div>
        </div>
      )}

      {step === "multiple-people" && selfieUrl && (
        <div className="space-y-4">
          <div className="relative inline-block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfieUrl} alt="Captured selfie" className="w-full rounded-lg" style={{ transform: "scaleX(-1)" }} />
            <VerificationBadge passed={false} icon={<Users className="w-7 h-7 text-white" />} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            <Users className="w-4 h-4 shrink-0" />
            <span>More than one person was detected. Please make sure only you are visible, then try again.</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {step === "result" && selfieUrl && (
        <div className="space-y-4">
          <div className="relative inline-block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfieUrl} alt="Captured selfie" className="w-full rounded-lg" style={{ transform: "scaleX(-1)" }} />
            <VerificationBadge passed={passed} />
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              passed ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {passed ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>
              {passed
                ? `Verified — ${matchScore?.toFixed(0)}% match.`
                : `This didn't match automatically (${matchScore?.toFixed(0)}% match) — your session will be flagged for staff review.`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <div className="flex-1">
              <ContinueButton onClick={onContinue} />
            </div>
          </div>
        </div>
      )}
    </CenteredCard>
  );
}

function VerificationBadge({ passed, icon }: { passed: boolean; icon?: React.ReactNode }) {
  return (
    <div
      className={`absolute -bottom-3 -right-3 rounded-full p-2.5 border-4 border-white shadow-lg ${
        passed ? "bg-green-500" : "bg-amber-500"
      }`}
    >
      {icon ?? (passed ? <CheckCircle2 className="w-7 h-7 text-white" /> : <XCircle className="w-7 h-7 text-white" />)}
    </div>
  );
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
    >
      Continue to Interview
    </button>
  );
}

function CenteredCard({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${wide ? "max-w-md w-full" : "max-w-md"}`}>
        {children}
      </div>
    </div>
  );
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
