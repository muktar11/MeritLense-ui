export type LiveCallState = "WAITING" | "ACTIVE" | "RECONNECTING" | "ENDED" | "FAILED";

export type LiveCallRole = "EVALUATOR" | "CANDIDATE";

export interface LiveCallParticipant {
  role: LiveCallRole;
  input_language: string;
  output_language: string;
  connected: boolean;
  last_seen_at: string | null;
}

export interface LiveCall {
  id: string;
  state: LiveCallState;
  audio_policy: string;
  started_at: string | null;
  ended_at: string | null;
  participants: LiveCallParticipant[];
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface LiveCallJoinResult {
  call: LiveCall;
  role: LiveCallRole;
  websocket_ticket: string;
  websocket_path: string;
  ice_servers: IceServer[];
  media: {
    input_format: string;
    translated_audio_event: string;
    original_remote_audio_muted: boolean;
  };
}

// Client -> server signaling messages (JSON text frames). Binary frames on
// the same socket are raw PCM16 mic audio, sent separately from these.
export type LiveCallClientAction =
  | { action: "offer"; data: { type: "offer"; sdp: string } }
  | { action: "answer"; data: { type: "answer"; sdp: string } }
  | { action: "ice_candidate"; data: RTCIceCandidateInit }
  | { action: "renegotiate"; data: Record<string, never> }
  | { action: "ping" }
  | { action: "end_call" };

// Server -> client events (JSON text frames).
export type LiveCallServerEvent =
  | { event: "ready"; role: LiveCallRole }
  | { event: "pong" }
  | { event: "offer"; data: { type: "offer"; sdp: string }; from: LiveCallRole }
  | { event: "answer"; data: { type: "answer"; sdp: string }; from: LiveCallRole }
  | { event: "ice_candidate"; data: RTCIceCandidateInit; from: LiveCallRole }
  | { event: "renegotiate"; data: Record<string, never>; from: LiveCallRole }
  | { event: "peer_presence"; role: LiveCallRole; connected: boolean }
  | { event: "translated_audio"; mime_type: string; audio: string }
  | { event: "translation_unavailable"; detail: string }
  | { event: "translation_error"; detail: string }
  | { event: "translation_reconfigured" }
  | { event: "call_ended" }
  | { event: "error"; detail: string };
