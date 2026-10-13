"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Cookie, X } from "lucide-react";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  recordCookieConsent,
  saveCookieConsent,
  type CookieChoice,
} from "@/lib/cookie-consent";

// Cookie consent banner (improvement deck, slide 3): Accept all / Reject
// optional / Preferences, separate from registration consent. Reopened from
// "Cookie settings" in the footer.
export function CookieConsentBanner() {
  const t = useTranslations("shared.cookieConsent");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    // Defer state updates out of the effect body.
    const timer = window.setTimeout(() => {
      if (!existing) {
        setVisible(true);
      } else {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
        if (!existing.recorded) recordCookieConsent(existing, locale);
      }
    }, 0);
    const reopen = () => {
      const current = readCookieConsent();
      setAnalytics(Boolean(current?.analytics));
      setMarketing(Boolean(current?.marketing));
      setPreferencesOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    };
  }, [locale]);

  const decide = async (choice: CookieChoice) => {
    setSaving(true);
    await saveCookieConsent(choice, { analytics, marketing, language: locale });
    setSaving(false);
    setVisible(false);
    setPreferencesOpen(false);
  };

  if (!visible && !preferencesOpen) return null;

  const secondary =
    "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60";
  const primary =
    "rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60";

  return (
    <>
      {visible && !preferencesOpen && (
        <div
          role="region"
          aria-label={t("title")}
          className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:flex-row sm:items-end sm:gap-5 sm:p-5">
            <div className="flex min-w-0 flex-1 gap-3">
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 sm:flex">
                <Cookie className="h-5 w-5 text-purple-600" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t("title")}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {t("body")}{" "}
                  <a href={`/${locale}/privacy`} className="font-medium text-purple-700 underline underline-offset-2">
                    {t("policyLink")}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <button type="button" className={secondary} onClick={() => setPreferencesOpen(true)} disabled={saving}>
                {t("preferences")}
              </button>
              <button type="button" className={secondary} onClick={() => decide("reject_optional")} disabled={saving}>
                {t("rejectOptional")}
              </button>
              <button type="button" className={primary} onClick={() => decide("accept_all")} disabled={saving}>
                {t("acceptAll")}
              </button>
            </div>
          </div>
        </div>
      )}

      {preferencesOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="cookie-preferences-title" className="text-lg font-bold text-gray-900">
                {t("preferencesTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setPreferencesOpen(false)}
                aria-label={t("close")}
                className="p-1 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="divide-y divide-gray-100">
              <li className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t("necessary")}</p>
                  <p className="text-sm text-gray-600">{t("necessaryDescription")}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  {t("alwaysOn")}
                </span>
              </li>
              {(
                [
                  ["analytics", analytics, setAnalytics],
                  ["marketing", marketing, setMarketing],
                ] as const
              ).map(([key, value, set]) => (
                <li key={key} className="flex items-start justify-between gap-4 py-3">
                  <label htmlFor={`cookie-${key}`} className="cursor-pointer">
                    <span className="block text-sm font-semibold text-gray-900">{t(key)}</span>
                    <span className="block text-sm text-gray-600">{t(`${key}Description`)}</span>
                  </label>
                  <input
                    id={`cookie-${key}`}
                    type="checkbox"
                    role="switch"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-purple-600"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className={secondary} onClick={() => decide("reject_optional")} disabled={saving}>
                {t("rejectOptional")}
              </button>
              <button type="button" className={primary} onClick={() => decide("custom")} disabled={saving}>
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
