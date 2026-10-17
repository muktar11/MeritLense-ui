"use client"

import { Bell, X } from "lucide-react"
import { useTranslations } from "next-intl"

// There is no in-app notification feed yet (updates go out by email), so
// the panel says so instead of showing sample items. Shared by B2B and B2C.
export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("dashboard.indivisual.notifications")

  return (
    <div className="absolute end-0 top-16 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">{t("title")}</h3>
        <button onClick={onClose} aria-label={t("close")} className="rounded-lg p-1 transition-colors hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
          <Bell className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium text-gray-900">{t("emptyTitle")}</p>
        <p className="text-xs text-gray-500">{t("emptyBody")}</p>
      </div>
    </div>
  )
}
