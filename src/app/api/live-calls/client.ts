import axios from "axios";
import { API_BASE_URL } from "@/lib/config/env";

// Deliberately separate from auth/client.ts's apiClient, mirroring
// interview-session/client.ts's interviewSessionClient: a candidate joins
// a live call anonymously via their per-session token, never a staff
// Bearer token. apiClient's request interceptor attaches a staff token
// from localStorage automatically whenever one exists there - which it
// does the moment the same browser has ever logged in as staff (e.g. an
// evaluator opening both the interviewer and candidate links to test
// them, or a shared device). That silently overrides the explicit
// candidateToken and gets the candidate authenticated as the evaluator
// instead, since the backend's role check (_role_for_request in
// api/live_calls/views.py) treats an authenticated staff user as
// authoritative and never falls through to the token. This client must
// never carry that interceptor.
export const liveCallClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
