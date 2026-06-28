"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Brain, CheckCircle2, Shield, Globe, Zap, Lock, FileCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export const Features = forwardRef<HTMLElement>(function Features(_, ref) {
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const t = useTranslations("landing-page.features");

  const featureIcons = [Shield, Globe, Zap, Lock, FileCheck, Users];

  const setRefs = (node: HTMLElement) => {
    if (ref) (ref as any).current = node;
    inViewRef(node);
  };

  return (
    <section id="features" ref={setRefs} className="py-16 lg:py-32">
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

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <div>
            <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary">
              <Brain className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-bold mb-4">{t("smart_evaluations.title")}</h3>
            <p className="text-lg text-foreground-muted leading-relaxed mb-6">{t("smart_evaluations.description")}</p>
            <ul className="space-y-3">
              {["list_item1", "list_item2", "list_item3"].map((key, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-1" />
                  <span className="text-foreground-muted">{t(`smart_evaluations.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop"
                alt={t("smart_evaluations.image_alt")}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:gap-12 md:grid-cols-2 lg:grid-cols-3 mt-24">
          {featureIcons.map((Icon, index) => (
            <div key={index} className="group bg-surface/80 rounded-2xl p-6 border text-center flex flex-col items-center justify-center">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t(`additional_features.${index}.title`)}</h3>
              <p className="text-foreground-muted leading-relaxed">{t(`additional_features.${index}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
