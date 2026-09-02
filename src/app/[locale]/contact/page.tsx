"use client";

import { Mail, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Navbar, Footer } from "../_components";

export default function ContactPage() {
  const t = useTranslations("landing-page.contact");

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("page_title")}
          </h1>
          <p className="text-lg text-foreground-muted mb-12">
            {t("page_subtitle")}
          </p>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                {t("team_name")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-muted">
                  {t("email_label")}
                </p>
                <a
                  href="mailto:info@meritlense.com"
                  className="text-base font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  info@meritlense.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
