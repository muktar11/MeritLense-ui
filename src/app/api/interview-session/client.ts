import axios from 'axios';
import { API_BASE_URL } from '@/lib/config/env';

// Deliberately separate from auth/client.ts's apiClient/authClient: this is
// used by anonymous candidates via a per-session token, never a staff
// Bearer token, so it must not carry the auto-attach/401-redirect interceptors
// those clients have.
//
// The token is sent as a query param (GET) or body field (POST) rather than
// a custom X-Session-Token header — the backend supports all three, and
// avoiding the custom header means these cross-origin requests stay "simple"
// requests with no CORS preflight, instead of requiring the API's CORS
// config to explicitly allow a header it doesn't allow today.
export const interviewSessionClient = axios.create({
  baseURL: `${API_BASE_URL}/interviews`,
  headers: {
    'Content-Type': 'application/json',
  },
});
