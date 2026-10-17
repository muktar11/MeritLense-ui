import { API_BASE_URL } from "@/lib/config/env";

// The visitor's cookie choice. Necessary cookies are always on; analytics
// and marketing stay off unless the visitor allows them. No optional
// cookies are set today - anything added later must check
// hasCookieConsent("analytics" | "marketing") before loading.

// this_session = "Just This Time": optional cookies for this visit only -
// kept in sessionStorage, so the banner asks again on the next visit.
export type CookieChoice = "accept_all" | "this_session" | "reject_optional" | "custom";

export interface CookieConsentState {
  consentId: string;
  choice: CookieChoice;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  recorded: boolean;
}

const STORAGE_KEY = "ml-cookie-consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "ml:open-cookie-settings";

export function readCookieConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsentState) : null;
  } catch {
    return null;
  }
}

export function hasCookieConsent(category: "analytics" | "marketing"): boolean {
  return Boolean(readCookieConsent()?.[category]);
}

function newConsentId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  // Older browsers: build a version-4 UUID from random bytes.
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Saves the choice locally right away, then records it on the server
// (consent records are kept there as history). A failed upload is retried
// on the next page load.
export async function saveCookieConsent(
  choice: CookieChoice,
  options: { analytics?: boolean; marketing?: boolean; language: string },
): Promise<CookieConsentState> {
  const previous = readCookieConsent();
  const allowAll = choice === "accept_all" || choice === "this_session";
  const state: CookieConsentState = {
    consentId: previous?.consentId ?? newConsentId(),
    choice,
    analytics: allowAll ? true : choice === "reject_optional" ? false : Boolean(options.analytics),
    marketing: allowAll ? true : choice === "reject_optional" ? false : Boolean(options.marketing),
    decidedAt: new Date().toISOString(),
    recorded: false,
  };
  persist(state);
  return recordCookieConsent(state, options.language);
}

export async function recordCookieConsent(state: CookieConsentState, language: string): Promise<CookieConsentState> {
  try {
    const response = await fetch(`${API_BASE_URL}/agreements/cookie-consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent_id: state.consentId,
        choice: state.choice,
        analytics: state.analytics,
        marketing: state.marketing,
        language,
      }),
    });
    if (response.ok) {
      const recorded = { ...state, recorded: true };
      persist(recorded);
      return recorded;
    }
  } catch {
    // Offline or blocked - kept locally and retried next time.
  }
  return state;
}

function persist(state: CookieConsentState) {
  try {
    if (state.choice === "this_session") {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Storage blocked - the banner simply shows again next visit.
  }
}
