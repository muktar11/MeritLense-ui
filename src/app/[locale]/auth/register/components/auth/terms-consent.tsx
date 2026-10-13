"use client"

import { useLocale, useTranslations } from "next-intl"

interface TermsConsentProps {
  variant: "b2c" | "b2b"
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

// Required registration consent (improvement deck): unchecked by default,
// links open the approved Terms and Privacy Policy in the page's language.
export default function TermsConsent({ variant, checked, onChange, error }: TermsConsentProps) {
  const t = useTranslations("auth_page.consent")
  const locale = useLocale()
  const link = (href: string) =>
    function PolicyLink(chunks: React.ReactNode) {
      return (
        <a
          href={`/${locale}${href}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {chunks}
        </a>
      )
    }

  return (
    <div className="space-y-1">
      <label
        htmlFor="terms_accepted"
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed ${
          error ? "border-destructive bg-destructive/5" : "border-input"
        }`}
      >
        <input
          id="terms_accepted"
          name="terms_accepted"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "terms_accepted_error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary,#4f46e5)]"
        />
        <span>
          {t.rich(variant === "b2c" ? "b2cStatement" : "b2bStatement", {
            terms: link("/terms"),
            privacy: link("/privacy"),
          })}
        </span>
      </label>
      {error && (
        <p id="terms_accepted_error" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
