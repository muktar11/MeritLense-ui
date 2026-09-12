"use client";

import { useTranslations } from "next-intl";
import { Navbar, Footer } from "../_components";

interface Section {
  id: string;
  title: string;
  part: null;
  updated: boolean;
  body: string;
}

function SectionBody({ body }: { body: string }) {
  const blocks = body.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <p key={i} className="text-foreground-muted leading-relaxed">
          {block}
        </p>
      ))}
    </div>
  );
}

export default function RefundsPolicyPage() {
  const t = useTranslations("legal.refunds_policy");
  const sections = t.raw("sections") as Section[];

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary mb-3">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            {t("title")}
          </h1>
          <p className="text-lg text-foreground-muted mb-8">{t("subtitle")}</p>

          <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 mb-8 text-sm">
            <div>
              <span className="block text-xs uppercase tracking-wide text-foreground-muted">
                {t("last_updated_label")}
              </span>
              <span className="font-medium text-foreground">{t("last_updated")}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-foreground-muted">
                {t("version_label")}
              </span>
              <span className="font-medium text-foreground">{t("version")}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-foreground-muted">
                {t("jurisdiction_label")}
              </span>
              <span className="font-medium text-foreground">{t("jurisdiction")}</span>
            </div>
          </div>

          <p className="text-foreground-muted leading-relaxed mb-12 border-s-2 border-primary/30 ps-4">
            {t("intro")}
          </p>

          <nav className="mb-14 rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-3">
              {t("toc_label")}
            </p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#section-${s.id}`}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {s.id}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-14">
            {sections.map((section) => (
              <div key={section.id} id={`section-${section.id}`} className="scroll-mt-28">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {section.id}. {section.title}
                </h3>
                <SectionBody body={section.body} />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
