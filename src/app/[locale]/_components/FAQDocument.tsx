"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Navbar, Footer } from "./index";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  items: FAQItem[];
}

function FAQEntry({ item, defaultOpen }: { item: FAQItem; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-start"
      >
        <span className="font-medium text-foreground">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-5 text-foreground-muted leading-relaxed">{item.answer}</p>}
    </div>
  );
}

export function FAQDocument() {
  const t = useTranslations("faq");
  const locale = useLocale();
  const categories = t.raw("categories") as FAQCategory[];

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
          <p className="text-lg text-foreground-muted mb-12">{t("subtitle")}</p>

          <nav className="mb-14 rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-3">
              {t("toc_label")}
            </p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#category-${category.id}`}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {category.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-14">
            {categories.map((category) => (
              <div key={category.id} id={`category-${category.id}`} className="scroll-mt-28">
                <h2 className="text-xl font-bold text-foreground mb-2">{category.title}</h2>
                <div className="rounded-xl border border-gray-200 px-5">
                  {category.items.map((item, index) => (
                    <FAQEntry key={item.id} item={item} defaultOpen={index === 0} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-gray-200 bg-gray-50 px-6 py-8 text-center">
            <p className="text-foreground-muted mb-4">{t("contact_prompt")}</p>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex rounded-full bg-primary text-white px-6 py-3 font-medium hover:bg-primary-600 transition"
            >
              {t("contact_cta")}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
