import { getTranslations } from "next-intl/server"
import { Dashboard } from "./components/dashboard"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "shared.pageMeta.b2bDashboard" })
  return { title: t("title"), description: t("description") }
}

export default function Page() {
  return <Dashboard />
}
