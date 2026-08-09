// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, rtlLocales, type Locale } from "@/config/locales";


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
      ...(await import(`../../../messages/${locale}/admin_companies.json`))
        .default,
    };
  } catch {
    notFound();
  }

  return (
    <div lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
