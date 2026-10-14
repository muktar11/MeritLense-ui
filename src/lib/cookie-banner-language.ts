// The cookie banner lives in the site layout and speaks the site's EN/AR
// (next-intl). On the candidate interview page the whole page is in the
// candidate's own language, so that page hands the banner its strings here
// (see interview/candidate-messages.ts); any key not provided falls back to
// the site translation.
import { useSyncExternalStore } from "react";

export type CookieBannerStrings = Record<string, string>;

type Override = { strings: CookieBannerStrings; dir: "ltr" | "rtl" } | null;

let current: Override = null;
const listeners = new Set<() => void>();

export function setCookieBannerLanguage(override: Override) {
  current = override;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCookieBannerLanguage(): Override {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
