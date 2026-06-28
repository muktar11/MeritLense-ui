"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useTranslations } from "next-intl";

export const HowItWorks = forwardRef<HTMLElement>(function HowItWorks(_, ref) {
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const t = useTranslations("landing-page.how_it_works");

  const steps = ["01", "02", "03"];

  const setRefs = (node: HTMLElement) => {
    if (ref) (ref as any).current = node;
    inViewRef(node);
  };

  return (
    <section id="how-it-works" ref={setRefs} className="py-16 lg:py-32 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ staggerChildren: 0.1 }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">{t("section_title")}</h2>
          <p className="text-xl text-foreground-muted">{t("section_subtitle")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            {steps.map((step, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="flex gap-6">
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{step}</div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{t(`steps.${idx}.title`)}</h3>
                  <p className="text-foreground-muted">{t(`steps.${idx}.description`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
