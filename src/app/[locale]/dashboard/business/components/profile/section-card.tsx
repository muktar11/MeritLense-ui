"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

// The card shell used by every section of the Company Profile page: an
// icon, a title with an optional subtitle, and an optional action on the
// trailing side.
export function SectionCard({
  id,
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  id?: string
  icon?: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && <Icon className="mt-0.5 h-6 w-6 shrink-0 text-purple-600" aria-hidden="true" />}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-gray-100">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  )
}

export function FieldTile({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60 ${className}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-gray-100">{children}</div>
    </div>
  )
}

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"

export const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"

export const outlineButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-60 dark:border-purple-800 dark:bg-transparent dark:text-purple-300"
