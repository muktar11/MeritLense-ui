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
import { useCookieBannerLanguage } from "@/lib/cookie-banner-language";

// Cookie consent banner (improvement deck design): Accept All / Just This
// Time / Reject, plus a "Manage preferences" link for per-category choices.
// Separate from registration consent; reopened from "Cookie settings" in
// the footer.
export function CookieConsentBanner() {
  const siteT = useTranslations("shared.cookieConsent");
  const locale = useLocale();
  // On the candidate interview page: the candidate's language (and its
  // direction), falling back to the site translation per key.
  const override = useCookieBannerLanguage();
  const t = (key: string) => override?.strings[key] ?? siteT(key);
  const dir = override?.dir;
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
          dir={dir}
          className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl md:flex-row md:items-center md:gap-6 md:p-5">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:h-14 sm:w-14">
                <Cookie className="h-6 w-6 text-amber-800 sm:h-7 sm:w-7" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t("title")}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {t("body")}{" "}
                  <a href={`/${locale}/privacy`} className="font-medium text-blue-700 underline underline-offset-2">
                    {t("policyLink")}
                  </a>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setPreferencesOpen(true)}
                    className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                  >
                    {t("managePreferences")}
                  </button>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:shrink-0">
              <button
                type="button"
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                onClick={() => decide("accept_all")}
                disabled={saving}
              >
                {t("acceptAll")}
              </button>
              <button
                type="button"
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                onClick={() => decide("this_session")}
                disabled={saving}
              >
                {t("justThisTime")}
              </button>
              <button type="button" className={`${secondary} rounded-xl px-5 py-2.5`} onClick={() => decide("reject_optional")} disabled={saving}>
                {t("reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {preferencesOpen && (
        <div dir={dir} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
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
