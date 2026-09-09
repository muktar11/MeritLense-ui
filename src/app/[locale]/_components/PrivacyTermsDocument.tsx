"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Navbar, Footer } from "./index";

interface Section {
  id: string;
  title: string;
  part: "a" | "b" | null;
  updated: boolean;
  body: string;
}

function SectionBody({ body }: { body: string }) {
  const blocks = body.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.trim().startsWith("- "));
        if (isList) {
          return (
            <ul key={i} className="space-y-2 ps-1">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2 text-foreground-muted leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  <span>{line.replace(/^- /, "")}</span>
                </li>
              ))}
            </ul>
          );
        }
        const isSubheading = block.length < 80 && !block.endsWith(".");
        return (
          <p
            key={i}
            className={
              isSubheading
                ? "font-semibold text-foreground pt-1"
                : "text-foreground-muted leading-relaxed"
            }
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function PrivacyTermsDocument({ focus }: { focus: "privacy" | "terms" }) {
  const t = useTranslations("legal.privacy_terms");
  const sections = t.raw("sections") as Section[];

  useEffect(() => {
    const targetId = focus === "terms" ? "part-b" : "part-a";
    const el = document.getElementById(targetId);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [focus]);

  let lastPart: string | null = null;

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
            {sections.map((section) => {
              const showPartDivider = section.part && section.part !== lastPart;
              lastPart = section.part;
              return (
                <div key={section.id}>
                  {showPartDivider && (
                    <div
                      id={`part-${section.part}`}
                      className="scroll-mt-28 mb-10 flex items-center gap-4"
                    >
                      <span className="shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide px-3 py-1.5">
                        {section.part === "a" ? t("part_a_label") : t("part_b_label")}
                      </span>
                      <h2 className="text-xl font-bold text-foreground">
                        {section.part === "a" ? t("part_a_title") : t("part_b_title")}
                      </h2>
                      <span className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div id={`section-${section.id}`} className="scroll-mt-28">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-foreground">
                        {section.id}. {section.title}
                      </h3>
                      {section.updated && (
                        <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 shrink-0">
                          {t("updated_badge")}
                        </span>
                      )}
                    </div>
                    <SectionBody body={section.body} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
