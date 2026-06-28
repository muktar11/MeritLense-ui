"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export const Pricing = forwardRef<HTMLElement, {}>(function Pricing(_, pricingRef) {
  const t = useTranslations("landing-page.pricing");

  // Intersection observer inside the component
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Combine forwarded ref with inViewRef
  const setRefs = (node: HTMLElement) => {
    inViewRef(node);
    if (pricingRef) (pricingRef as any).current = node;
  };

  const pricesB2C = ["€50", "€80", "€120", "€200"];
  const pricesB2B = ["€500", "€1,500", "€3,500", "Custom"];
  const popularIndexB2C = 1;
  const popularIndexB2B = 1;

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
                      <span className="text-4xl font-bold text-secondary-900">{pricesB2C[index]}</span>
                      <span className="text-secondary-900">{t("individual_employers.time_unit")}</span>
                    </div>
                    <div className="text-foreground-muted mt-1">{t(`individual_employers.plans.${index}.candidates_count`)}</div>
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
                    <Link href={index === 3 ? "/contact" : "/auth/register"}>
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
                      <span className="text-4xl font-bold text-secondary-900">{pricesB2B[index]}</span>
                      <span className="text-secondary-900">{t("organizations_agencies.time_unit")}</span>
                    </div>
                    <div className="text-foreground-muted mt-1">{t(`organizations_agencies.plans.${index}.candidates_count`)}</div>
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
                    <Link href={index === 3 ? "/contact" : "/auth/register"}>
                      {index === 3 ? t("cta_contact_sales") : t("cta_get_started")}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
});
