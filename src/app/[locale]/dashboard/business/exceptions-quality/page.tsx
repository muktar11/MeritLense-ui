import { getTranslations } from "next-intl/server";
import { CustomerExceptionsQuality } from "@/components/evaluations/CustomerExceptionsQuality";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.business.exceptionsQuality" });
  return { title: t("title"), description: t("subtitle") };
}

export default function Page() {
  return <CustomerExceptionsQuality namespace="dashboard.business.exceptionsQuality" />;
}
