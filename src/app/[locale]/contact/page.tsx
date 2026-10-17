"use client";

import { Mail, MapPin, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Navbar, Footer } from "../_components";

export default function ContactPage() {
  const t = useTranslations("landing-page.contact");

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-5">
            {t("page_title")}
          </h1>
          <p className="text-lg lg:text-xl text-foreground-muted mb-14 max-w-2xl mx-auto">
            {t("page_subtitle")}
          </p>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 text-start">
            <div className="flex-1 flex flex-col justify-center gap-10 rounded-3xl border border-gray-200 bg-white shadow-md p-8 sm:p-12">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-2xl font-semibold text-foreground">
                  {t("team_name")}
                </span>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-foreground-muted mb-1">
                    {t("email_label")}
                  </p>
                  <a
                    href="mailto:info@meritlense.com"
                    className="text-lg font-medium leading-relaxed text-primary hover:text-primary-600 transition-colors"
                  >
                    info@meritlense.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-foreground-muted mb-1">
                    {t("address_label")}
                  </p>
                  <a
                    href="https://maps.app.goo.gl/9EQbVVz9VRVTH3Lz6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium leading-relaxed text-primary hover:text-primary-600 transition-colors"
                  >
                    MeritLense OÜ, Ruunaoja tn 3, 11415 Tallinn, Estonia
                  </a>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-3xl border border-gray-200 shadow-md">
              <iframe
                title={t("address_label")}
                src="https://www.google.com/maps?q=MeritLense+O%C3%9C%2C+Ruunaoja+tn+3%2C+11415+Tallinn%2C+Estonia&z=16&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block", minHeight: 440 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
