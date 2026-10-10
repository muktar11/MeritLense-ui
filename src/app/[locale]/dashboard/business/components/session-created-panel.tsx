"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { QRCodeSVG } from "qrcode.react"
import { Check, Copy, FileText, Link2, Mail, MessageCircle, QrCode, User } from "lucide-react"

interface SessionCreatedPanelProps {
  candidateName: string
  candidateEmail?: string
  roleName: string
  coverageLabel: string
  coverageClassName: string
  link: string
  onClose: () => void
}

/** Success state of the Create Assessment modal: a short, shareable
 *  candidate link with one-click copy, plus Email / WhatsApp / QR sharing. */
export default function SessionCreatedPanel({
  candidateName,
  candidateEmail,
  roleName,
  coverageLabel,
  coverageClassName,
  link,
  onClose,
}: SessionCreatedPanelProps) {
  const t = useTranslations("shared.startSessionModal")
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const shareText = t("shareMessage", { name: candidateName, link })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Clipboard blocked (e.g. insecure context) - select the text instead
      // so the user can copy it manually.
      const input = document.getElementById("session-short-link") as HTMLInputElement | null
      input?.select()
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const emailHref =
    `mailto:${encodeURIComponent(candidateEmail ?? "")}` +
    `?subject=${encodeURIComponent(t("emailSubject"))}&body=${encodeURIComponent(shareText)}`
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  const shareButton =
    "flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-purple-300 hover:text-purple-700"

  return (
    <div className="py-2">
      {/* Success */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
              <Check className="h-6 w-6 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{t("successTitle")}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {t("successMessagePrefix")} <span className="font-semibold text-gray-900">{candidateName}</span>{" "}
          {t("successMessageSuffix")}
        </p>
      </div>

      {/* Role and coverage */}
      <div className="mx-auto mt-5 grid max-w-md grid-cols-2 divide-x divide-gray-200 rounded-xl bg-gray-50 px-2 py-3 rtl:divide-x-reverse">
        <div className="flex items-center gap-3 px-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <User className="h-4 w-4 text-blue-600" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t("roleShort")}</p>
            <p className="truncate text-sm font-medium text-gray-900">{roleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <FileText className="h-4 w-4 text-blue-600" />
          </span>
          <div>
            <p className="text-xs text-gray-500">{t("coverageShort")}</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${coverageClassName}`}>
              {coverageLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Interview link */}
      <div className="mt-5 rounded-2xl bg-purple-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100">
            <Link2 className="h-5 w-5 text-purple-600" />
          </span>
          <div>
            <p className="text-base font-semibold text-gray-900">{t("interviewLinkTitle")}</p>
            <p className="text-sm text-gray-500">{t("interviewLinkSubtitle")}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            id="session-short-link"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            dir="ltr"
            className="min-w-0 flex-1 rounded-xl border border-purple-100 bg-purple-100/50 px-4 py-2.5 font-mono text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label={t("interviewLinkTitle")}
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
              copied ? "bg-green-600" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("linkCopied") : t("copyLink")}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a href={emailHref} className={shareButton}>
            <Mail className="h-4 w-4 text-blue-600" />
            {t("shareEmail")}
          </a>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={shareButton}>
            <MessageCircle className="h-4 w-4 text-green-600" />
            {t("shareWhatsApp")}
          </a>
          <button type="button" onClick={() => setShowQr((v) => !v)} className={shareButton} aria-expanded={showQr}>
            <QrCode className="h-4 w-4 text-gray-700" />
            {showQr ? t("hideQr") : t("showQr")}
          </button>
        </div>

        {showQr && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
            <QRCodeSVG value={link} size={168} level="M" fgColor="#1f2937" />
            <p className="text-xs text-gray-500">{t("qrHint")}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center border-t pt-5">
        <button
          onClick={onClose}
          className="rounded-xl bg-purple-600 px-10 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          {t("close")}
        </button>
      </div>
    </div>
  )
}
