// Location & Localization detection utilities.
//
// Every function here is a pure suggestion signal, never a source of truth:
// callers must only use these to pre-fill a still-empty field, and must
// never overwrite a value the user has already set or touched. None of
// this is ever sent to MeritLense's own backend as raw detected data -
// only whatever the user explicitly confirms and submits gets persisted
// (see Candidate/CompanyEmployerProfile/IndividualEmployerProfile's
// country_of_residence/target_market/timezone fields).

/** Sync, zero-cost, zero-privacy-risk - the browser already knows this. */
export function detectTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Full IANA timezone list for manual-override <select>s (settings tabs,
 * candidate modals) - populated at runtime from the browser's own Intl
 * data rather than hardcoded, so it's always current. Empty array on
 * older browsers without Intl.supportedValuesOf; callers should still
 * render the current saved value as an option even when this is empty.
 */
export function getTimezoneOptions(): string[] {
  try {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    return typeof supportedValuesOf === "function" ? supportedValuesOf("timeZone") : [];
  } catch {
    return [];
  }
}

// The platform's own UI only ever supports two languages (EN/AR - see
// next-intl's routing config), so the suggestion rule is deliberately
// simple rather than trying to map arbitrary browser locales: a detected
// country in the Arabic-speaking region suggests Arabic, everything else
// suggests English. This is the Arab League's 22 members - the concrete,
// decisive definition of "Middle East / Arabic-speaking region" used here.
export const ARABIC_REGION_COUNTRY_CODES = [
  "DZ", "BH", "KM", "DJ", "EG", "IQ", "JO", "KW", "LB", "LY", "MR", "MA",
  "OM", "PS", "QA", "SA", "SO", "SD", "SY", "TN", "AE", "YE",
] as const;

export function suggestLanguageFromCountry(countryCode: string | null | undefined): "EN" | "AR" | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return (ARABIC_REGION_COUNTRY_CODES as readonly string[]).includes(code) ? "AR" : "EN";
}

/** Fallback only, used while country detection is still pending/unavailable. */
export function suggestLanguageFromBrowser(): "EN" | "AR" | null {
  try {
    const lang = navigator.language;
    if (!lang) return null;
    return lang.toLowerCase().startsWith("ar") ? "AR" : "EN";
  } catch {
    return null;
  }
}

export interface DetectedCountry {
  countryCode: string;
}

const COUNTRY_DETECTION_TIMEOUT_MS = 3000;

/**
 * Async, best-effort, never throws. Calls ipapi.co directly from the
 * browser (keyless, CORS-enabled, free tier is 1,000 req/day per visitor
 * IP) so MeritLense's own backend never sees or logs the raw IP-derived
 * location - only what the user explicitly confirms gets submitted.
 * Returns null on any failure, rate-limit, or timeout; callers must treat
 * that exactly like "detection unavailable", never as an error to surface.
 */
export async function detectCountry(): Promise<DetectedCountry | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COUNTRY_DETECTION_TIMEOUT_MS);
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error || !data?.country_code) return null;
    return { countryCode: String(data.country_code).toUpperCase() };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
