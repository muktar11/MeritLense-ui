"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";

// Animation variants
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export const Hero = forwardRef<HTMLElement, {}>(function Hero(_, heroRef) {
  const t = useTranslations("landing-page.hero");

  // In-view hook
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Combine refs if forwarded
  const setRefs = (node: HTMLElement) => {
    inViewRef(node);
    if (heroRef) (heroRef as any).current = node;
  };

  return (
    <section ref={setRefs} className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <div>
            <motion.div variants={fadeInUp}>
              <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-full px-4 py-2">
                {t("badge")}
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              {t("title_part1")}{" "}
              <span className="text-gradient-primary font-semibold">{t("title_part2_ai_power")}</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-foreground-muted mb-10 leading-relaxed">
              {t("description")}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary-700 text-white rounded-full px-8 h-14 text-base" asChild>
                <Link href="/auth/register">
                  {t("cta_start_evaluating")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border hover:bg-secondary-100 border-secondary hover:text-secondary" asChild>
                <Link href="#features">{t("cta_explore_platform")}</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div variants={fadeInUp} className="relative">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <Image src="/images/Hero.png" alt={t("image_alt")} fill sizes="w-[1200px]" className="object-cover z-10" priority />
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-22 sm:w-64 sm:h-64 bg-primary/40 rounded-full blur-3xl" />
            <div className="absolute -top-4 -left-4 w-32 h-32 sm:w-48 sm:h-48 bg-secondary/40 rounded-full blur-3xl" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});
