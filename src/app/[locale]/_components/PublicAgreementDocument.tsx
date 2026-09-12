"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, AlertTriangle } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { AgreementType } from "@/app/api/agreements/types";
import { Navbar, Footer } from "./index";

interface PublicAgreementDocumentProps {
  agreementType: Extract<AgreementType, "B2C_AGREEMENT" | "B2B_AGREEMENT">;
  translationKey: "b2c_agreement" | "b2b_agreement";
}

// Renders the same unsigned template shown to a signer mid-signup (see
// AgreementService.getPreview, used in dashboard/*/sign-agreements), but via
// the auth-free public-preview endpoint with no company/user filled in -
// this page is reachable from the marketing site footer before anyone has
// an account. Displayed in an iframe (srcDoc) since the backend renders a
// complete standalone HTML document, matching the sign-agreements review step.
export function PublicAgreementDocument({ agreementType, translationKey }: PublicAgreementDocumentProps) {
  const t = useTranslations(`legal.${translationKey}`);
  const locale = useLocale();
  const [html, setHtml] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setHtml(null);
    setError(false);
    agreementService
      .getPublicPreview(agreementType, locale === "ar" ? "ar" : "en")
      .then((preview) => {
        if (!active) return;
        setHtml(preview.html);
        setVersion(preview.version);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [agreementType, locale]);

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary mb-3">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            {t("title")}
          </h1>
          <p className="text-lg text-foreground-muted mb-8">{t("subtitle")}</p>

          {version && (
            <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 mb-8 text-sm">
              <div>
                <span className="block text-xs uppercase tracking-wide text-foreground-muted">
                  {t("version_label")}
                </span>
                <span className="font-medium text-foreground">{version}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white min-h-[70vh]">
            {error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-foreground-muted">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p>{t("load_error")}</p>
              </div>
            ) : !html ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <iframe title={t("title")} srcDoc={html} className="w-full h-[75vh]" />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
