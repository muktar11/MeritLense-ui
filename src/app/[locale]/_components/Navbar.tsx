"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import { useTranslations, useLocale } from "next-intl";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("landing-page.navbar");
  const locale = useLocale();

  const withLocale = (path: string) => `/${locale}${path}`;

  return (
    <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link href={withLocale("/")} className="flex items-center space-x-3">
          <Image
            src="/meritlense-logo-v2-stacked.svg"
            alt={t("logo_alt")}
            width={278}
            height={174}
            className="h-14 w-auto"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-12">
          <a
            href={withLocale("/#features")}
            className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            {t("menu_items.features")}
          </a>
          <a
            href={withLocale("/#how-it-works")}
            className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            {t("menu_items.how_it_works")}
          </a>
          <a
            href={withLocale("/#pricing")}
            className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            {t("menu_items.pricing")}
          </a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="ghost" asChild className="rounded-full">
            <Link href={withLocale("/auth/login")}>
              {t("actions.sign_in")}
            </Link>
          </Button>

          <Button className="bg-primary text-white rounded-full px-6" asChild>
            <Link href={withLocale("/auth/register")}>
              {t("actions.get_started")}
            </Link>
          </Button>

          <LanguageSelector />
        </div>

        {/* Mobile Button */}
        <div className="lg:hidden p-2 flex gap-2">
          <LanguageSelector />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {/* Mobile Menu */}
{mobileMenuOpen && (
  <div className="lg:hidden border-t border-gray-100 bg-white">
    <div className="container mx-auto px-6 py-8">
      {/* Navigation Links */}
      <div className="flex flex-col space-y-6 text-center">
        <a
          href={withLocale("/#features")}
          onClick={() => setMobileMenuOpen(false)}
          className="text-lg font-medium text-gray-800 hover:text-primary transition-colors"
        >
          {t("menu_items.features")}
        </a>

        <a
          href={withLocale("/#how-it-works")}
          onClick={() => setMobileMenuOpen(false)}
          className="text-lg font-medium text-gray-800 hover:text-primary transition-colors"
        >
          {t("menu_items.how_it_works")}
        </a>

        <a
          href={withLocale("/#pricing")}
          onClick={() => setMobileMenuOpen(false)}
          className="text-lg font-medium text-gray-800 hover:text-primary transition-colors"
        >
          {t("menu_items.pricing")}
        </a>
      </div>

      {/* Divider */}
      <div className="my-8 h-px bg-gray-200" />

      {/* Actions */}
      <div className="flex flex-col space-y-4">
        <Button
          variant="ghost"
          className="w-full rounded-full text-base"
          asChild
        >
          <Link href={withLocale("/auth/login")}>
            {t("actions.sign_in")}
          </Link>
        </Button>

        <Button
          className="w-full bg-primary text-white rounded-full text-base py-6"
          asChild
        >
          <Link href={withLocale("/auth/register")}>
            {t("actions.get_started")}
          </Link>
        </Button>
      </div>
    </div>
  </div>
)}

    </nav>
  );
}
