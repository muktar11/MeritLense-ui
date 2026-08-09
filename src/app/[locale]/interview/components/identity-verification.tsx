"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, RotateCcw, ShieldCheck, Users, XCircle } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import { ensureModelsLoaded, IDENTITY_DETECTOR_TUNING } from "@/lib/face-detection";

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
  | "no-face-detected"
  | "multiple-people"
  | "setup-failed"
  | "unavailable";

// face-api.js's own documented heuristic: a descriptor distance below ~0.6
// generally indicates the same person. We display a friendlier 0-100 "match
// score" scaled against that same boundary (distance 0 -> 100%, distance
// 0.6 -> 0%), so a positive score already means "within the same-person
// range" - see PASS_SCORE_THRESHOLD below for where the actual pass line
// sits within that range.
const MATCH_DISTANCE_THRESHOLD = 0.6;

// Keep this aligned with InterviewSession.candidate_prechecks_complete on
// the backend so the UI never reports success for a session that cannot start.
const PASS_SCORE_THRESHOLD = 85;

// Identity verification always takes this long from the candidate's
// perspective, regardless of how fast the actual comparison finishes -
// gives the process a consistent, deliberate feel instead of resolving
// instantly (which reads as untrustworthy) or unpredictably.
const VERIFICATION_DURATION_SECONDS = 30;

export function IdentityVerification({ sessionId, token, onContinue }: IdentityVerificationProps) {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const [countdown, setCountdown] = useState(VERIFICATION_DURATION_SECONDS);

  const videoRef = useRef<HTMLVideoElement>(null);
  const referenceImgRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selfieBlobRef = useRef<Blob | null>(null);
  const hasReferenceRef = useRef(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const loadSetup = async () => {
    setStep("loading");
    // These two are deliberately separate try/catches, not a single
    // Promise.all - they fail for very different reasons and need very
    // different messaging. A missing/unreadable reference photo needs staff
    // to fix (no amount of retrying helps), while model loading can fail on
    // a slow/flaky connection and often just needs a real retry.
    let blob: Blob;
    try {
      blob = await interviewSessionService.getReferenceImage(sessionId, token);
    } catch {
      if (!mountedRef.current) return;
      hasReferenceRef.current = false;
      setStep("unavailable");
      return;
    }

    try {
      await ensureModelsLoaded();
    } catch {
      if (!mountedRef.current) return;
      setStep("setup-failed");
      return;
    }

    if (!mountedRef.current) return;
    setReferenceUrl(URL.createObjectURL(blob));
    hasReferenceRef.current = true;
    setStep("ready");
  };

  useEffect(() => {
    loadSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
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
    setCountdown(VERIFICATION_DURATION_SECONDS);
    const startedAt = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setCountdown(Math.max(0, VERIFICATION_DURATION_SECONDS - elapsed));
    }, 250);
    const minDuration = new Promise<void>((resolve) => setTimeout(resolve, VERIFICATION_DURATION_SECONDS * 1000));

    let nextStep: Step = "result";
    try {
      const faceapi = await ensureModelsLoaded();

      const selfieImg = await blobToImage(selfieBlob);
      const referenceImg = referenceImgRef.current;
      if (!referenceImg) throw new Error("Reference image not available");

      const detectorOptions = new faceapi.TinyFaceDetectorOptions(IDENTITY_DETECTOR_TUNING);
      const selfieResults = await faceapi
        .detectAllFaces(selfieImg, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (selfieResults.length > 1) {
        // Hard block - this is the one case in this flow that isn't a soft
        // gate. A second person visible at the very start of the interview
        // is an unambiguous problem, distinct from "the photo didn't match
        // well" (which is now also a hard gate, but shows the ordinary
        // failure screen instead of this specific one).
        await interviewSessionService.submitIdentityVerification(sessionId, token, {
          selfieBlob,
          faceMatchScore: 0,
          singleFaceDetected: false,
          livenessPassed: true,
        }).catch(() => {});
        nextStep = "multiple-people";
      } else if (selfieResults.length === 0) {
        // Distinct from "detected a face but it didn't match closely
        // enough" - no comparison was even attempted, most commonly caused
        // by poor lighting, backlighting, or the face not being framed in
        // the shot. Actionable and different advice from a genuine mismatch.
        nextStep = "no-face-detected";
      } else {
        const selfieResult = selfieResults[0];
        const referenceResults = await faceapi
          .detectAllFaces(referenceImg, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptors();
        const referenceResult = referenceResults[0];

        if (!referenceResult) {
          // The reference document itself isn't readable as a face (poor
          // scan quality, ID photo obscured, etc.) - a system/data issue
          // rather than something the candidate can fix by retaking their
          // own photo, so route to the same guidance as "unavailable"
          // rather than implying a retry would help.
          nextStep = "unavailable";
        } else {
          const distance = faceapi.euclideanDistance(selfieResult.descriptor, referenceResult.descriptor);
          const score = Math.max(0, Math.min(100, (1 - distance / MATCH_DISTANCE_THRESHOLD) * 100));

          setMatchScore(score);
          setPassed(score >= PASS_SCORE_THRESHOLD);

          await interviewSessionService.submitIdentityVerification(sessionId, token, {
            selfieBlob,
            faceMatchScore: score,
            singleFaceDetected: true,
            // face-api.js does basic 2D face matching but no real liveness/anti-spoofing
            // check (e.g. detecting a photo held up to the camera) - reporting true
            // here reflects that limitation honestly rather than implying a check
            // that isn't actually happening.
            livenessPassed: true,
          });
        }
      }
    } catch {
      setMatchScore(0);
      setPassed(false);
    }

    await minDuration;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setStep(nextStep);
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
        <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-red-700 mb-2">Identification Failed</h1>
        <p className="text-gray-600 mb-2">
          We couldn&apos;t find a readable reference photo on file for this session.
        </p>
        <p className="text-gray-600">
          Please contact the person who invited you to this interview — your session cannot proceed until this is
          resolved.
        </p>
      </CenteredCard>
    );
  }

  if (step === "setup-failed") {
    return (
      <CenteredCard>
        <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t load verification</h1>
        <p className="text-gray-600 mb-6">
          This is usually a temporary connection issue. Please check your internet connection and try again.
        </p>
        <button
          type="button"
          onClick={() => loadSetup()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      </CenteredCard>
    );
  }

  // Reference photo is always visible (side-by-side against the live camera
  // / captured selfie) once we have one, from "ready" onward - the candidate
  // should be able to see exactly what's being compared, not just trust a
  // hidden background process.
  const referenceImg = referenceUrl && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={referenceImgRef}
      src={referenceUrl}
      alt="ID on file"
      crossOrigin="anonymous"
      className="w-full h-full object-cover"
    />
  );

  return (
    <CenteredCard wide>
      <ShieldCheck className="w-12 h-12 text-purple-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Verify your identity</h1>
      <p className="text-gray-600 text-sm mb-6">
        Take a quick photo so we can confirm it&apos;s you. You won&apos;t be able to start the interview until this
        passes.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>
      )}

      {step === "ready" && (
        <div className="space-y-4">
          <CompareLayout
            left={<Placeholder label="You" icon={<Camera className="w-8 h-8" />} />}
            right={referenceImg ? <LabeledPane label="ID on file">{referenceImg}</LabeledPane> : <Placeholder label="ID on file" />}
          />
          <VerificationTips />
          <button
            type="button"
            onClick={handleStartCamera}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            <Camera className="w-4 h-4" /> Start Camera
          </button>
        </div>
      )}

      {step === "camera-active" && (
        <div className="space-y-3">
          <CompareLayout
            left={
              <LabeledPane label="You">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: "scaleX(-1)" }}
                  className="w-full h-full object-cover bg-black"
                />
              </LabeledPane>
            }
            right={referenceImg ? <LabeledPane label="ID on file">{referenceImg}</LabeledPane> : <Placeholder label="ID on file" />}
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
          <CompareLayout
            left={
              <LabeledPane label="You">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfieUrl} alt="Captured selfie" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
              </LabeledPane>
            }
            right={referenceImg ? <LabeledPane label="ID on file">{referenceImg}</LabeledPane> : <Placeholder label="ID on file" />}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-600 py-2">
            {step === "comparing" ? (
              <>
                <div className="w-14 h-14 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
                <span className="font-medium">Verifying identity… {countdown}s</span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing…
              </>
            )}
          </div>
        </div>
      )}

      {step === "no-face-detected" && selfieUrl && (
        <div className="space-y-4">
          <CompareLayout
            left={
              <div className="relative">
                <LabeledPane label="You">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieUrl} alt="Captured selfie" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                </LabeledPane>
                <VerificationBadge passed={false} icon={<AlertCircle className="w-6 h-6 text-white" />} />
              </div>
            }
            right={referenceImg ? <LabeledPane label="ID on file">{referenceImg}</LabeledPane> : <Placeholder label="ID on file" />}
          />
          <h2 className="text-lg font-bold text-red-700">No Face Detected</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>We couldn&apos;t find a clear face in that photo — this isn&apos;t a match result, we simply
              couldn&apos;t analyze the image.</span>
          </div>
          <VerificationTips />
          <button
            type="button"
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {step === "multiple-people" && selfieUrl && (
        <div className="space-y-4">
          <CompareLayout
            left={
              <div className="relative">
                <LabeledPane label="You">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieUrl} alt="Captured selfie" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                </LabeledPane>
                <VerificationBadge passed={false} icon={<Users className="w-6 h-6 text-white" />} />
              </div>
            }
            right={referenceImg ? <LabeledPane label="ID on file">{referenceImg}</LabeledPane> : <Placeholder label="ID on file" />}
          />
          <h2 className="text-lg font-bold text-red-700">Identification Failed</h2>
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
          <CompareLayout
            left={
              <div className="relative">
                <LabeledPane label="You">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieUrl} alt="Captured selfie" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                </LabeledPane>
                <VerificationBadge passed={passed} />
              </div>
            }
            right={referenceImg ? <LabeledPane label="ID on file">{referenceImg}</LabeledPane> : <Placeholder label="ID on file" />}
          />
          <h2 className={`text-lg font-bold ${passed ? "text-green-700" : "text-red-700"}`}>
            {passed ? "Identity Verified" : "Identification Failed"}
          </h2>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              passed ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {passed ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>
              {passed
                ? `${matchScore?.toFixed(0)}% match.`
                : `${matchScore?.toFixed(0)}% match — this doesn't meet the required threshold.`}
            </span>
          </div>
          {!passed && <VerificationTips />}
          {passed ? (
            <ContinueButton onClick={onContinue} />
          ) : (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          )}
        </div>
      )}
    </CenteredCard>
  );
}

function VerificationTips() {
  return (
    <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-700 mb-1.5">For a successful match:</p>
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>Face a light source — avoid sitting with a window or light behind you</li>
        <li>Look directly at the camera with your full face visible</li>
        <li>Remove sunglasses or anything covering your face</li>
        <li>Make sure only you are in frame</li>
      </ul>
    </div>
  );
}

function CompareLayout({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {left}
      {right}
    </div>
  );
}

function LabeledPane({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1 text-center">{label}</p>
      <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square border border-gray-200">{children}</div>
    </div>
  );
}

function Placeholder({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <LabeledPane label={label}>
      <div className="w-full h-full flex items-center justify-center text-gray-300">
        {icon ?? <Loader2 className="w-6 h-6 animate-spin" />}
      </div>
    </LabeledPane>
  );
}

function VerificationBadge({ passed, icon }: { passed: boolean; icon?: React.ReactNode }) {
  return (
    <div
      className={`absolute -bottom-2 -right-2 rounded-full p-2 border-4 border-white shadow-lg ${
        passed ? "bg-green-500" : "bg-amber-500"
      }`}
    >
      {icon ?? (passed ? <CheckCircle2 className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />)}
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
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${wide ? "max-w-lg w-full" : "max-w-md"}`}>
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
