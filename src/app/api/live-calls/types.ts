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
  evaluation_id: string | null;
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
  | { action: "end_call" }
  | { action: "admit" }
  | { action: "deny" }
  // Turn-taking: broadcast so the other participant's record button can be
  // disabled while this side is mid-turn (recording, reviewing, or sending)
  // - see useLiveCall's turn-recording effect.
  | { action: "turn_recording_started" }
  | { action: "turn_recording_ended" };

// Server -> client events (JSON text frames).
export interface LiveCallTranslationSegment {
  id: string;
  speaker_role: LiveCallRole;
  recipient_role?: LiveCallRole;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text: string;
  // Present only on turns received live; saved turns keep no audio.
  translated_audio?: string;
  mime_type?: string;
  input_mode?: "AUDIO" | "TEXT";
  competency?: string;
  sent_at: string;
}

// A conversation turn as saved by the backend (no audio).
export type LiveCallSavedSegment = Omit<LiveCallTranslationSegment, "translated_audio" | "mime_type" | "recipient_role">;

export interface LiveCallGuideQuestion {
  id: string;
  text: string;
  order: number;
  status: string;
}

// Evaluator-only context for the scheduled interview and scorecard.
export interface LiveCallGuide {
  session_id: string;
  evaluation_id: string | null;
  candidate: { name: string; photo_url: string | null };
  role_name: string;
  role_code: string;
  scheduled_start_at: string | null;
  evaluator_name: string;
  candidate_language: string;
  call: LiveCall | null;
  competencies: { key: import("../evaluations/types").ScorecardCompetency; questions: LiveCallGuideQuestion[] }[];
  conversation: LiveCallSavedSegment[];
}

export type LiveCallServerEvent =
  | { event: "ready"; role: LiveCallRole }
  | { event: "pong" }
  | { event: "offer"; data: { type: "offer"; sdp: string }; from: LiveCallRole }
  | { event: "answer"; data: { type: "answer"; sdp: string }; from: LiveCallRole }
  | { event: "ice_candidate"; data: RTCIceCandidateInit; from: LiveCallRole }
  | { event: "renegotiate"; data: Record<string, never>; from: LiveCallRole }
  | { event: "peer_presence"; role: LiveCallRole; connected: boolean }
  | { event: "waiting_for_admission" }
  | { event: "join_request" }
  | { event: "join_request_dismissed" }
  | { event: "admitted" }
  | { event: "translation_segment"; payload: LiveCallTranslationSegment }
  | { event: "translated_audio"; mime_type: string; audio: string }
  | { event: "translation_unavailable"; detail: string }
  | { event: "translation_error"; detail: string }
  | { event: "translation_reconfigured" }
  | { event: "call_ended" }
  | { event: "error"; detail: string }
  | { event: "turn_recording_started"; data: null; from: LiveCallRole }
  | { event: "turn_recording_ended"; data: null; from: LiveCallRole };
