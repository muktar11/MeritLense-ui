"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter, Linkedin, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing-page.footer");

  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <Image
                src="/logo.svg"
                alt={t("logo_alt")}
                width={150}
                height={40}
                className="h-12 w-32"
              />
            </Link>
            <p className="text-foreground-muted leading-relaxed mb-6">
              {t("mission_statement")}
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.linkedin.com/in/merit-lens-56674a384/"
                target="_blank"
                className="text-foreground-muted hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/LensMerit"
                target="_blank"
                className="text-foreground-muted hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/meritlense/"
                target="_blank"
                className="text-foreground-muted hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:info@meritlense.com"
                className="text-foreground-muted hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">
              {t("links_section_title")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  {t("link_features")}
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  {t("link_how_it_works")}
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  {t("link_pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">
              {t("newsletter_section_title")}
            </h4>
            <p className="text-foreground-muted mb-4">
              {t("newsletter_description")}
            </p>
            <form className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                placeholder={t("newsletter_placeholder")}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="rounded-full bg-primary text-white px-6 py-3 hover:bg-primary-600 transition"
              >
                {t("newsletter_button")}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-16 pt-8 text-center text-sm text-foreground-muted">
          ©2026 {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
