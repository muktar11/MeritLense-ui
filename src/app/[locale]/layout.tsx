// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { locales, rtlLocales, type Locale } from "@/config/locales";
import { buildPageMetadata } from "@/lib/buildPageMetadata";


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shared.pageMeta.siteDefault" });
  const title = t("title");
  const description = t("description");

  return {
    ...buildPageMetadata({ locale, title, description }),
    // Only the layout sets a template - a child page's plain string title
    // (e.g. "Privacy Policy") gets wrapped into it automatically, while the
    // homepage keeps this exact default title as-is.
    title: { default: title, template: "%s | MeritLense" },
    applicationName: "MeritLense",
  };
}


interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  if (!locales.includes(locale)) {
    notFound();
  }

  // Required so next-intl resolves the locale from the static route param
  // instead of request headers, which are unavailable during static export.
  setRequestLocale(locale);

  const isRtl = rtlLocales.includes(locale);

  let messages;
  try {
    messages = {
      ...(await import(`../../../messages/${locale}/common.json`)).default,
      ...(await import(`../../../messages/${locale}/legal.json`)).default,
    };
  } catch {
    notFound();
  }

  return (
    <div lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
        <Toaster richColors position={isRtl ? "top-left" : "top-right"} dir={isRtl ? "rtl" : "ltr"} />
      </NextIntlClientProvider>
    </div>
  );
}
