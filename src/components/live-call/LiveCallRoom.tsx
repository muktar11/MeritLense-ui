"use client";

import { useState } from "react";
import { Loader2, Mic, PhoneOff, AlertTriangle, Video, UserCheck, UserX } from "lucide-react";
import { useLiveCall } from "./useLiveCall";
import { LANGUAGES } from "@/lib/languages";
import { EvaluatorRatingCard } from "@/components/evaluations/EvaluatorRatingCard";

interface LiveCallRoomProps {
  sessionId: string;
  // Present for the candidate flow (from the emailed interview link's
  // token query param); omitted for the evaluator, who's a logged-in
  // staff user instead.
  candidateToken?: string;
  onEnded?: () => void;
}

export function LiveCallRoom({ sessionId, candidateToken, onEnded }: LiveCallRoomProps) {
  const {
    status,
    role,
    error,
    remoteConnected,
    languagePrefs,
    setLanguagePrefs,
    translationUnavailable,
    joinRequest,
    admitCandidate,
    denyCandidate,
    endCall,
    localVideoRef,
    remoteVideoRef,
    evaluationId,
  } = useLiveCall({ sessionId, candidateToken });

  const [savingLanguage, setSavingLanguage] = useState(false);

  const handleEndCall = () => {
    endCall();
    onEnded?.();
  };

  const handleLanguageChange = async (field: "input_language" | "output_language", value: string) => {
    if (!languagePrefs) return;
    setSavingLanguage(true);
    try {
      await setLanguagePrefs({ ...languagePrefs, [field]: value });
    } finally {
      setSavingLanguage(false);
    }
  };

  if (status === "ended") {
    const showRatingCard = role === "EVALUATOR" && evaluationId;
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl p-8 text-center w-full ${showRatingCard ? "max-w-lg" : "max-w-md"}`}>
          <PhoneOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Call ended</h1>
          <p className="text-gray-600">This live interview call has ended.</p>
          {showRatingCard && (
            <div className="mt-6 text-left">
              <EvaluatorRatingCard evaluationId={evaluationId} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t join the call</h1>
          <p className="text-gray-600">{error ?? "Please refresh and try again."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />

        {!remoteConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
              <p className="text-sm">
                {status === "joining" && "Joining the call…"}
                {status === "waiting" && "Waiting for the other participant to join…"}
                {status === "pending_admission" && "Waiting for the evaluator to let you in…"}
                {status === "reconnecting" && "Reconnecting…"}
                {status === "connecting" && "Connecting…"}
              </p>
            </div>
          </div>
        )}

        {role === "EVALUATOR" && joinRequest && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full mx-4">
              <UserCheck className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <h2 className="text-base font-semibold text-gray-900 mb-1">Candidate wants to join</h2>
              <p className="text-sm text-gray-600 mb-5">Let them into the interview?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={denyCandidate}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                >
                  <UserX className="w-4 h-4" /> Deny
                </button>
                <button
                  type="button"
                  onClick={admitCandidate}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                >
                  <UserCheck className="w-4 h-4" /> Admit
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black" />
        </div>

        {translationUnavailable && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Live translation is unavailable right now
          </div>
        )}

        {role && (
          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Video className="w-3 h-3" />
            {role === "EVALUATOR" ? "You're the evaluator" : "You're the candidate"}
          </div>
        )}
      </div>

      <div className="bg-gray-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-gray-400" />
            <label className="text-xs text-gray-300">I speak</label>
            <select
              value={languagePrefs?.input_language ?? "en-US"}
              onChange={(e) => handleLanguageChange("input_language", e.target.value)}
              disabled={savingLanguage}
              className="text-xs bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-300">I want to hear</label>
            <select
              value={languagePrefs?.output_language ?? "en-US"}
              onChange={(e) => handleLanguageChange("output_language", e.target.value)}
              disabled={savingLanguage}
              className="text-xs bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEndCall}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
        >
          <PhoneOff className="w-4 h-4" /> End Call
        </button>
      </div>
    </div>
  );
}
