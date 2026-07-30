import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/config/env";

const KNOWN_LOCALES = ["en", "ar"];
const DEFAULT_LOCALE = "en";

function getLoginRedirectPath(): string {
  if (typeof window === "undefined") return `/${DEFAULT_LOCALE}/auth/login`;
  const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
  const locale = KNOWN_LOCALES.includes(firstSegment) ? firstSegment : DEFAULT_LOCALE;
  return `/${locale}/auth/login`;
}

// The one place that actually ends a session client-side. Every axios
// instance wired up via attachAuthInterceptors() below routes here on an
// unrecoverable 401 (no refresh token, or the refresh attempt itself
// failed) - previously several client modules reimplemented this
// individually and inconsistently, and their FormData variants mostly
// didn't implement it at all, so an expired token during e.g. a candidate
// creation upload just failed silently instead of sending the user back
// to login.
export function forceLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  window.location.href = getLoginRedirectPath();
}

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh: refreshToken });
      const access: string = response.data.access;
      localStorage.setItem("accessToken", access);
      return access;
    })();
    // Clear the in-flight marker once settled either way, so the *next*
    // 401 (after this one resolves) starts a fresh refresh rather than
    // reusing a stale resolved/rejected promise.
    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Attaches the current access token to every outgoing request, and on a
// 401 response tries exactly one silent refresh-and-retry before giving up
// and forcing a logout. Meant to be called once per axios instance that
// talks to an authenticated endpoint - the single source of truth for this
// behavior, shared by every api/*/client.ts module instead of each
// reimplementing (and subtly diverging from) it.
export function attachAuthInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const access = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return instance(originalRequest);
        } catch {
          forceLogout();
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
}
