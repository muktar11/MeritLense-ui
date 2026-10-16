// A timestamp shown in UTC, written in the page language (verification
// pages show UTC so every viewer sees the same moment).
export function formatUtc(value: string | null | undefined, locale: string): string {
  if (!value) return "\u2014"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`
}
