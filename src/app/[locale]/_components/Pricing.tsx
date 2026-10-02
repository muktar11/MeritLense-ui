"use client";

import { forwardRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";
import { useInView } from "react-intersection-observer";
import { getStartedUrl } from "@/lib/getStartedUrl";
import paymentService from "@/app/api/payments/endpoints";
import type { PublicPrice } from "@/app/api/payments/types";

const B2C_PACKAGE_CODES = ["basic", "essential", "advanced", "premium"];
const B2B_PACKAGE_CODES = ["starter", "growth", "business", "enterprise"];

// Whole-euro amounts render without decimals ("€60", "€2,000"), matching
// this page's existing style - a genuinely fractional price (not expected
// today, but the live data could in principle carry one) still shows cents.
function formatWholeOrDecimal(amount: number, currency: string) {
  const isWhole = Number.isInteger(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export const Pricing = forwardRef<HTMLElement, {}>(function Pricing(_, pricingRef) {
  const t = useTranslations("landing-page.pricing");
  const locale = useLocale();

  // Intersection observer inside the component
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Combine forwarded ref with inViewRef
  const setRefs = (node: HTMLElement) => {
    inViewRef(node);
    if (pricingRef) (pricingRef as any).current = node;
  };

  // Static fallback - used until the live fetch resolves, and permanently
  // for Starter/Enterprise, which have no fixed Price row by design
  // ("Based on Scope"/"Custom", not a fixed SKU).
  const pricesB2C = ["€60", "€100", "€150", "€200"];
  const pricesB2B = [t("organizations_agencies.per_agreement_label"), "€2,000", "€3,500", "Custom"];
  const popularIndexB2C = 1;
  const popularIndexB2B = 1;

  // Commercial Package Alignment: price/capacity numbers come from the
  // live Price records (GET /payments/prices/public, no auth needed - this
  // is the public marketing page) instead of a separately hand-maintained
  // copy that can drift out of sync with what checkout/invoices actually
  // charge. Feature-bullet copy stays in translations - that's editorial
  // content with no home on the Price model, not billing data.
  const [publicPrices, setPublicPrices] = useState<PublicPrice[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await paymentService.getPublicPrices();
        if (active) setPublicPrices(data);
      } catch {
        // Falls back to the static copy below - never blocks the page.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const findLivePrice = (packageCode: string) => publicPrices.find((p) => p.package_code === packageCode);

  const getFeatures = (key: string, index: number) => {
    const arr = t.raw(key);
    return Array.isArray(arr) && arr[index]?.features ? arr[index].features : [];
  };

  return (
    <section id="pricing" ref={setRefs} className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("section_title")}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-foreground-muted">
            {t("section_subtitle")}
          </motion.p>
        </motion.div>

        {/* B2C Pricing */}
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerContainer} className="mb-24">
          <h3 className="text-2xl font-bold text-foreground text-center mb-12">{t("individual_employers.title")}</h3>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {[0, 1, 2, 3].map((index) => {
              const isPopular = index === popularIndexB2C;
              const features = getFeatures("individual_employers.plans", index);
              const livePrice = findLivePrice(B2C_PACKAGE_CODES[index]);
              const priceLabel = livePrice
                ? formatWholeOrDecimal(Number(livePrice.unit_amount), livePrice.currency)
                : pricesB2C[index];
              const capacityLabel = livePrice?.slot_grant != null
                ? t("individual_employers.candidates_count_dynamic", { count: livePrice.slot_grant })
                : t(`individual_employers.plans.${index}.candidates_count`);

              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`relative p-8 rounded-2xl border bg-white border-secondary-700 ${isPopular ? "scale-110 shadow-2xl" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary border-0 rounded-full px-4 py-1">{t("popular_badge")}</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{t(`individual_employers.plans.${index}.name`)}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-secondary-900">{priceLabel}</span>
                      <span className="text-secondary-900">{t("individual_employers.time_unit")}</span>
                    </div>
                    <div className="text-foreground-muted mt-1">{capacityLabel}</div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        <span className="text-sm text-foreground-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full rounded-full h-12 bg-white border border-secondary-700 text-secondary-700 hover:text-white hover:[background:var(--gradient-primary)]"
                    asChild
                  >
                    <Link href={index === 3 ? `/${locale}/contact` : getStartedUrl(locale)}>
                      {index === 3 ? t("cta_contact_sales") : t("cta_get_started")}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* B2B Pricing */}
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerContainer}>
          <h3 className="text-2xl font-bold text-foreground text-center mb-12">{t("organizations_agencies.title")}</h3>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {[0, 1, 2, 3].map((index) => {
              const isPopular = index === popularIndexB2B;
              const features = getFeatures("organizations_agencies.plans", index);
              const livePrice = findLivePrice(B2B_PACKAGE_CODES[index]);
              const priceLabel = livePrice
                ? formatWholeOrDecimal(Number(livePrice.unit_amount), livePrice.currency)
                : pricesB2B[index];
              const capacityLabel = livePrice?.slot_grant != null
                ? t("organizations_agencies.candidates_count_dynamic", { count: livePrice.slot_grant })
                : t(`organizations_agencies.plans.${index}.candidates_count`);

              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`relative p-8 rounded-2xl border ${isPopular ? "scale-110 shadow-2xl" : "bg-white border-secondary-700"}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-white border-0 rounded-full px-4 py-1">{t("popular_badge")}</Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{t(`organizations_agencies.plans.${index}.name`)}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-secondary-900">{priceLabel}</span>
                      {index !== 0 && (
                        <span className="text-secondary-900">{t("organizations_agencies.time_unit")}</span>
                      )}
                    </div>
                    <div className="text-foreground-muted mt-1">{capacityLabel}</div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        <span className="text-sm text-foreground-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full rounded-full h-12 bg-white border border-secondary-700 text-secondary-700 hover:text-white hover:[background:var(--gradient-primary)]"
                    asChild
                  >
                    <Link href={index === 3 ? `/${locale}/contact` : getStartedUrl(locale)}>
                      {index === 3 ? t("cta_contact_sales") : t("cta_get_started")}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Paid Pilot callout - a separate B2B entry option, not a fifth
              standard package (Commercial Package Alignment, Section 9). */}
          <motion.div variants={fadeInUp} className="max-w-3xl mx-auto mt-16 text-center p-10 rounded-2xl border border-secondary-700 bg-white">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">{t("paid_pilot.eyebrow")}</p>
            <h4 className="text-2xl font-bold text-foreground mb-3">{t("paid_pilot.heading")}</h4>
            <p className="text-foreground-muted mb-4">{t("paid_pilot.description")}</p>
            <p className="text-sm text-foreground-muted mb-6">
              {t.raw("paid_pilot.scope_items").join(" · ")}
            </p>
            <p className="text-sm font-medium text-foreground mb-6">{t("paid_pilot.pricing_label")}</p>
            <Button
              className="rounded-full h-12 px-8 bg-white border border-secondary-700 text-secondary-700 hover:text-white hover:[background:var(--gradient-primary)]"
              asChild
            >
              <Link href={`/${locale}/contact`}>{t("paid_pilot.cta_label")}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});
