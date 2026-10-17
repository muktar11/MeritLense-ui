'use client';

import { Check, ChevronDown, Globe } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { restoreFormStateAfterLocaleSwitch, saveFormStateForLocaleSwitch } from "@/lib/locale-switch-form-state";

// Each language is named in its own script, so a reader can find theirs
// whatever the page is currently showing.
const LANGUAGES: { code: string; name: string; dir: "ltr" | "rtl" }[] = [
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "en", name: "English", dir: "ltr" },
];

interface LanguageSelectorProps {
  // Kept for existing call sites; the names are fixed per language now.
  locales?: Record<string, string>;
  className?: string;
}

export function LanguageSelector(props: LanguageSelectorProps) {
  // useSearchParams needs a Suspense boundary in static export builds.
  return (
    <Suspense fallback={null}>
      <LanguageSelectorInner {...props} />
    </Suspense>
  );
}

function LanguageSelectorInner({ className = "" }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname.split('/')[1] || 'en';
  const current = LANGUAGES.find((l) => l.code === currentLocale) ?? LANGUAGES[1];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Put back what was typed before a language switch on this page.
  useEffect(() => restoreFormStateAfterLocaleSwitch(pathname), [pathname]);

  const switchLanguage = (locale: string) => {
    setOpen(false);
    if (locale === currentLocale) return;
    saveFormStateForLocaleSwitch(pathname);
    const segments = pathname.split('/');
    segments[1] = locale;
    // Keep the query string (e.g. an interview link's sessionId and token).
    const query = searchParams.toString();
    router.push(segments.join('/') + (query ? `?${query}` : '') + window.location.hash);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${current.name} - ${currentLocale === "ar" ? "تغيير اللغة" : "Change language"}`}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        <Globe className="h-4 w-4 text-gray-700" aria-hidden="true" />
        <span dir={current.dir}>{current.name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={currentLocale === "ar" ? "اللغة" : "Language"}
          className="absolute end-0 z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          {LANGUAGES.map((lang) => {
            const selected = lang.code === currentLocale;
            return (
              <li key={lang.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => switchLanguage(lang.code)}
                  lang={lang.code}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-start transition-colors ${
                    selected ? "bg-blue-50 font-semibold text-gray-900" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span dir={lang.dir}>{lang.name}</span>
                  {selected && <Check className="h-4 w-4 text-blue-600" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
