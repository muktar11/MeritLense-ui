"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Mic,
  PhoneOff,
  AlertTriangle,
  Video,
  UserCheck,
  UserX,
  Square,
  RotateCcw,
  Send,
} from "lucide-react";
import { useLiveCall } from "./useLiveCall";
import { LANGUAGES } from "@/lib/languages";
import { EvaluatorRatingCard } from "@/components/evaluations/EvaluatorRatingCard";
import { CallControlsIntro } from "./CallControlsIntro";

interface LiveCallRoomProps {
  sessionId: string;
  // Present for the candidate flow (from the emailed interview link's
  // token query param); omitted for the evaluator, who's a logged-in
  // staff user instead.
  candidateToken?: string;
  onEnded?: () => void;
  // True when rendered inside a dashboard shell (DashboardLayout's h-16
  // breadcrumb bar sits above this component) rather than as its own
  // full page - h-screen would then be 4rem taller than the space
  // actually available in the shell's scrollable <main>, forcing a
  // vertical scroll to see the whole call. The standalone candidate
  // /interview page has no such chrome above it, so it keeps h-screen.
  embedded?: boolean;
}

export function LiveCallRoom({ sessionId, candidateToken, onEnded, embedded = false }: LiveCallRoomProps) {
  const t = useTranslations("shared.liveCallRoom");
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages");
  const roomHeightClass = embedded ? "h-[calc(100vh-4rem)]" : "h-screen";
  const {
    status,
    role,
    error,
    notOpenUntil,
    remoteConnected,
    languagePrefs,
    setLanguagePrefs,
    translationUnavailable,
    translationSegments,
    turnRecordingState,
    turnRecordingError,
    turnPreviewUrl,
    turnElapsedSeconds,
    remoteTurnActive,
    startTurnRecording,
    stopTurnRecording,
    reRecordTurn,
    submitTurnRecording,
    joinRequest,
    admitCandidate,
    denyCandidate,
    endCall,
    localVideoRef,
    remoteVideoRef,
    evaluationId,
  } = useLiveCall({ sessionId, candidateToken });

  const [savingLanguage, setSavingLanguage] = useState(false);
  const otherRoleLabel = role === "EVALUATOR" ? t("candidateLabel") : t("evaluatorLabel");
  // State, not a plain ref: CallControlsIntro needs to know as soon as
  // these DOM nodes exist so it can measure and spotlight them, and a
  // plain ref's .current wouldn't trigger the re-render that requires. The
  // record target alternates between a <button> and a <div> depending on
  // remoteTurnActive, hence the wider HTMLElement type.
  const [recordEl, setRecordEl] = useState<HTMLElement | null>(null);
  const [languageEl, setLanguageEl] = useState<HTMLDivElement | null>(null);

  const formatTurnTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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
      <div className={`${roomHeightClass} bg-gray-900 flex items-center justify-center p-4 overflow-y-auto`}>
        <div className={`bg-white rounded-2xl p-8 text-center w-full ${showRatingCard ? "max-w-lg" : "max-w-md"}`}>
          <PhoneOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t("callEnded")}</h1>
          <p className="text-gray-600">{t("callEndedMessage")}</p>
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
      <div className={`${roomHeightClass} bg-gray-900 flex items-center justify-center p-4 overflow-y-auto`}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t("couldntJoin")}</h1>
          <p className="text-gray-600">{error ?? t("refreshAndTryAgain")}</p>
          {notOpenUntil && (
            <p className="text-gray-500 text-sm mt-3">
              {t("opensAt")}{" "}
              <span className="font-medium text-gray-700">
                {new Date(notOpenUntil).toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>{" "}
              {t("yourLocalTime")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${roomHeightClass} overflow-hidden bg-gray-900 flex flex-col`}>
      <div className="flex-1 flex flex-col xl:flex-row min-h-0">
        <div className="relative flex-1 min-h-[240px] xl:min-h-[420px]">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />

          {!remoteConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
                <p className="text-sm">
                  {status === "joining" && t("statusJoining")}
                  {status === "waiting" && t("statusWaiting")}
                  {status === "pending_admission" && t("statusPendingAdmission")}
                  {status === "reconnecting" && t("statusReconnecting")}
                  {status === "connecting" && t("statusConnecting")}
                </p>
              </div>
            </div>
          )}

          {role === "EVALUATOR" && joinRequest && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full mx-4">
                <UserCheck className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h2 className="text-base font-semibold text-gray-900 mb-1">{t("candidateWantsToJoin")}</h2>
                <p className="text-sm text-gray-600 mb-5">{t("letThemIn")}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={denyCandidate}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    <UserX className="w-4 h-4" /> {t("deny")}
                  </button>
                  <button
                    type="button"
                    onClick={admitCandidate}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                  >
                    <UserCheck className="w-4 h-4" /> {t("admit")}
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
              {t("manualTranslationActive")}
            </div>
          )}

          {role && (
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Video className="w-3 h-3" />
              {role === "EVALUATOR" ? t("youreEvaluator") : t("youreCandidate")}
            </div>
          )}
        </div>

        <aside className="w-full xl:w-[380px] bg-slate-900 border-t xl:border-t-0 xl:border-l border-slate-700 flex flex-col min-h-[180px] max-h-[40vh] xl:max-h-none xl:min-h-[260px]">
          <div className="p-4 border-b border-slate-700 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t("manualTranslationLabel")}</p>
              <h2 className="text-lg font-semibold text-white">{t("messageFeed")}</h2>
            </div>

            {remoteTurnActive && (
              <div className="flex items-center gap-2 rounded-lg bg-purple-500/15 border border-purple-500/40 px-3 py-2 text-xs text-purple-200">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
                </span>
                {t("isSpeaking", { role: otherRoleLabel })}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-1.5 rounded-lg bg-red-950/60 border border-red-800 px-3 py-2 text-xs text-red-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {turnRecordingError && (
              <div className="flex items-start gap-1.5 rounded-lg bg-red-950/60 border border-red-800 px-3 py-2 text-xs text-red-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{turnRecordingError}</span>
              </div>
            )}

            {turnRecordingState === "idle" && (
              remoteTurnActive ? (
                <div
                  ref={setRecordEl}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 text-sm font-medium cursor-not-allowed"
                >
                  <Mic className="w-4 h-4" />
                  {t("waitingToFinish", { role: otherRoleLabel })}
                </div>
              ) : (
                <button
                  ref={setRecordEl}
                  type="button"
                  onClick={() => void startTurnRecording()}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-purple-400/60 rounded-lg text-purple-300 hover:bg-purple-500/10 text-sm font-medium"
                >
                  <Mic className="w-4 h-4" />
                  {t("tapToRecord")}
                </button>
              )
            )}

            {turnRecordingState === "recording" && (
              <div className="flex flex-col items-center gap-2 py-3 border-2 border-purple-500 rounded-lg bg-purple-500/10">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  {t("recording", { time: formatTurnTime(turnElapsedSeconds) })}
                </div>
                <button
                  type="button"
                  onClick={stopTurnRecording}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-900 rounded-lg text-sm font-medium"
                >
                  <Square className="w-3.5 h-3.5" /> {t("stop")}
                </button>
              </div>
            )}

            {(turnRecordingState === "recorded" || turnRecordingState === "sending") && turnPreviewUrl && (
              <div className="space-y-2">
                <audio controls src={turnPreviewUrl} className="w-full h-9" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reRecordTurn}
                    disabled={turnRecordingState === "sending"}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-600 hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t("reRecord")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitTurnRecording()}
                    disabled={turnRecordingState === "sending"}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                  >
                    {turnRecordingState === "sending" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {turnRecordingState === "sending" ? t("sending") : t("send")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {translationSegments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/60 p-4 text-sm text-slate-300">
                {t("noSegmentsYet")}
              </div>
            ) : (
              translationSegments.map((segment) => (
                <div key={segment.id} className="rounded-xl bg-slate-800 p-3 text-sm text-slate-100">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span>{segment.speaker_role === role ? t("you") : t("otherParticipant")}</span>
                    <span>{segment.target_language}</span>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{t("original")}</p>
                  <p className="text-sm text-slate-100 mb-2">{segment.original_text}</p>
                  <p className="text-xs uppercase tracking-wide text-purple-300 mb-1">{t("translated")}</p>
                  <p className="text-sm text-purple-100">{segment.translated_text}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <div className="bg-gray-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div ref={setLanguageEl} className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-gray-400" />
            <label className="text-xs text-gray-300">{t("iSpeak")}</label>
            <select
              value={languagePrefs?.input_language ?? "en-US"}
              onChange={(e) => handleLanguageChange("input_language", e.target.value)}
              disabled={savingLanguage}
              className="text-xs bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {tLanguages(lang.key)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-300">{t("iWantToHear")}</label>
            <select
              value={languagePrefs?.output_language ?? "en-US"}
              onChange={(e) => handleLanguageChange("output_language", e.target.value)}
              disabled={savingLanguage}
              className="text-xs bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {tLanguages(lang.key)}
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
          <PhoneOff className="w-4 h-4" /> {t("endCall")}
        </button>
      </div>

      <CallControlsIntro recordTarget={recordEl} languageTarget={languageEl} />
    </div>
  );
}
