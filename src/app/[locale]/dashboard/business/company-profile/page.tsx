import { getTranslations } from "next-intl/server"
import { CompanyProfile } from "../components/company-profile"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "shared.pageMeta.b2bCompanyProfile" })
  return { title: t("title"), description: t("description") }
}

export default function Page() {
  return <CompanyProfile />
}
