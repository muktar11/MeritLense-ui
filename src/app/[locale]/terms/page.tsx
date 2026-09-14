import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { PrivacyTermsDocument } from "../_components/PrivacyTermsDocument";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shared.pageMeta.termsOfService" });

  return buildPageMetadata({
    locale,
    path: "/terms",
    title: t("title"),
    description: t("description"),
  });
}

export default function TermsPage() {
  return <PrivacyTermsDocument focus="terms" />;
}
