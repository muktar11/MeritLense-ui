import { getTranslations } from "next-intl/server"
import { ScoreManagement } from "../components/score-management"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "shared.pageMeta.b2bScoreManagement" })
  return { title: t("title"), description: t("description") }
}

export default function Page() {
  return <ScoreManagement />
}