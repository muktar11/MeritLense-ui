"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import liveCallService from "@/app/api/live-calls/endpoints";
import type { LiveCallRole, LiveCallServerEvent } from "@/app/api/live-calls/types";
import { API_BASE_URL } from "@/lib/config/env";
import { downsampleTo16k } from "./pcm";
import { TranslatedAudioQueue } from "./audio-queue";

export type LiveCallStatus =
  | "idle"
  | "joining"
  | "waiting"
  | "pending_admission"
  | "connecting"
  | "active"
  | "reconnecting"
  | "ended"
  | "error";

interface LanguagePrefs {
  input_language: string;
  output_language: string;
}

interface UseLiveCallOptions {
  sessionId: string;
  // Present for the candidate (the token from their emailed interview link);
  // omitted for the evaluator, who authenticates as a normal logged-in
  // staff user instead - see api/live-calls/endpoints.ts.
  candidateToken?: string;
}

function wsUrlFor(path: string, ticket: string): string {
  // websocket_path is origin-relative (e.g. "/ws/live-calls/{id}/") - the
  // Channels routing in meritlense/asgi.py is mounted at the app root, not
  // under /api/v1 like the REST endpoints, so this needs the API's origin,
  // not API_BASE_URL itself.
  const origin = new URL(API_BASE_URL).origin.replace(/^http/, "ws");
  return `${origin}${path}?ticket=${encodeURIComponent(ticket)}`;
}

export function useLiveCall({ sessionId, candidateToken }: UseLiveCallOptions) {
  const [status, setStatus] = useState<LiveCallStatus>("idle");
  const [role, setRole] = useState<LiveCallRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [languagePrefs, setLanguagePrefsState] = useState<LanguagePrefs | null>(null);
  const [translationUnavailable, setTranslationUnavailable] = useState(false);
  // Evaluator-only: a candidate is knocking and hasn't been admitted/denied yet.
  const [joinRequest, setJoinRequest] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<TranslatedAudioQueue>(new TranslatedAudioQueue());
  const roleRef = useRef<LiveCallRole | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const endedIntentionallyRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const cleanupMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    audioQueueRef.current.clear();
  }, []);

  const cleanupConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // avoid triggering reconnect on an intentional close
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const sendSignal = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ action: "ice_candidate", data: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        // Translated speech replaces the original remote audio per the
        // backend's fixed audio_policy (REPLACE_ORIGINAL) - the remote
        // video stays live, but its audio track must stay muted so the
        // listener only ever hears the translated_audio playback queue,
        // not the original voice underneath it.
        remoteVideoRef.current.muted = true;
      }
    };

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return;
      if (pc.connectionState === "connected") {
        setStatus("active");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setRemoteConnected(false);
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    return pc;
  }, [sendSignal]);

  const createAndSendOffer = useCallback(async () => {
    const pc = pcRef.current ?? createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ action: "offer", data: { type: offer.type, sdp: offer.sdp } });
  }, [createPeerConnection, sendSignal]);

  const startPcmCapture = useCallback(() => {
    if (!localStreamRef.current) return;
    // AudioContext's sampleRate hint is frequently ignored by the browser -
    // downsampleTo16k handles whatever we actually get. ScriptProcessorNode
    // is deprecated but still universally supported and far simpler to ship
    // than an AudioWorklet module for a statically-exported app; an
    // AudioWorklet would be the natural upgrade if main-thread audio
    // processing ever becomes a measurable problem.
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = (event) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      const input = event.inputBuffer.getChannelData(0);
      const pcm = downsampleTo16k(input, audioContext.sampleRate);
      wsRef.current.send(pcm.buffer);
    };
  }, []);

  const handleServerEvent = useCallback(
    async (event: LiveCallServerEvent) => {
      const pc = pcRef.current;
      switch (event.event) {
        case "ready":
          setRole(event.role);
          roleRef.current = event.role;
          setStatus("waiting");
          break;
        case "waiting_for_admission":
          setStatus("pending_admission");
          break;
        case "join_request":
          setJoinRequest(true);
          break;
        case "join_request_dismissed":
          setJoinRequest(false);
          break;
        case "admitted":
          setStatus("waiting");
          break;
        case "peer_presence":
          setRemoteConnected(event.connected);
          // Deterministic offer-initiator rule to avoid glare: the
          // evaluator always makes the offer, once they know the candidate
          // is on the call. The candidate only ever answers.
          if (event.connected && event.role === "CANDIDATE" && roleRef.current === "EVALUATOR") {
            await createAndSendOffer();
          }
          if (!event.connected) {
            setStatus((current) => (current === "active" ? "reconnecting" : current));
          }
          break;
        case "offer": {
          const activePc = pc ?? createPeerConnection();
          await activePc.setRemoteDescription(new RTCSessionDescription(event.data));
          const answer = await activePc.createAnswer();
          await activePc.setLocalDescription(answer);
          sendSignal({ action: "answer", data: { type: answer.type, sdp: answer.sdp } });
          break;
        }
        case "answer":
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(event.data));
          break;
        case "ice_candidate":
          if (pc && event.data) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(event.data));
            } catch {
              // Candidates that arrive before the remote description is set
              // are expected and harmless to drop - the ICE agent will
              // still connect via the ones that land after.
            }
          }
          break;
        case "translated_audio":
          audioQueueRef.current.enqueue(event.audio);
          break;
        case "translation_unavailable":
        case "translation_error":
          setTranslationUnavailable(true);
          break;
        case "translation_reconfigured":
          setTranslationUnavailable(false);
          break;
        case "call_ended":
          endedIntentionallyRef.current = true;
          setStatus("ended");
          cleanupConnection();
          cleanupMedia();
          break;
        case "error":
          setError(event.detail);
          break;
      }
    },
    [createAndSendOffer, createPeerConnection, sendSignal, cleanupConnection, cleanupMedia]
  );

  const connect = useCallback(async () => {
    setStatus("joining");
    setError(null);
    try {
      const joined = await liveCallService.join(sessionId, candidateToken);
      if (!mountedRef.current) return;
      setRole(joined.role);
      roleRef.current = joined.role;
      iceServersRef.current = joined.ice_servers as RTCIceServer[];
      setLanguagePrefsState(
        joined.call.participants.find((p) => p.role === joined.role) ?? {
          input_language: "en-US",
          output_language: "en-US",
        }
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      startPcmCapture();

      const ws = new WebSocket(wsUrlFor(joined.websocket_path, joined.websocket_ticket));
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as LiveCallServerEvent;
          handleServerEvent(payload);
        } catch {
          // Ignore malformed frames rather than crashing the call.
        }
      };
      ws.onclose = () => {
        if (!mountedRef.current || endedIntentionallyRef.current) return;
        setStatus("reconnecting");
        // Reconnect by requesting a fresh ticket and rebuilding the peer
        // connection, per docs/LIVE_INTERPRETED_CALLS.md's reconnect
        // contract - a stale ticket/socket can't simply be reopened.
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && !endedIntentionallyRef.current) connect();
        }, 2000);
      };
      ws.onerror = () => {
        setError("Connection to the call server was interrupted.");
      };
    } catch (err) {
      if (!mountedRef.current) return;
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Couldn't join the call. Please refresh and try again.";
      setError(detail);
      setStatus("error");
    }
  }, [sessionId, candidateToken, handleServerEvent, startPcmCapture]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      cleanupConnection();
      cleanupMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = useCallback(() => {
    endedIntentionallyRef.current = true;
    sendSignal({ action: "end_call" });
    cleanupConnection();
    cleanupMedia();
    setStatus("ended");
  }, [sendSignal, cleanupConnection, cleanupMedia]);

  const admitCandidate = useCallback(() => {
    setJoinRequest(false);
    sendSignal({ action: "admit" });
  }, [sendSignal]);

  const denyCandidate = useCallback(() => {
    setJoinRequest(false);
    sendSignal({ action: "deny" });
  }, [sendSignal]);

  const setLanguagePrefs = useCallback(
    async (prefs: LanguagePrefs) => {
      const updated = await liveCallService.setLanguages(sessionId, prefs, candidateToken);
      setLanguagePrefsState(
        updated.participants.find((p) => p.role === roleRef.current) ?? prefs
      );
    },
    [sessionId, candidateToken]
  );

  return {
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
  };
}
