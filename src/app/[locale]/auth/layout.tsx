// src/app/[locale]/auth/layout.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations("landing-page.navbar");
  const tCommon = useTranslations("auth_page.common");

  return (
    <div>
      <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-12">
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="/logo.png"
              alt={t("logo_alt")}
              width={506}
              height={459}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {tCommon("back_to_home")}
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
