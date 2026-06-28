"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function CTA() {
  const t = useTranslations('landing-page.cta')

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-30" />

          <div className="absolute inset-0 backdrop-blur-sm bg-white/20" />

          <div className="relative p-4 lg:p-20 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              {t('title')}
            </h2>
            <p className="text-xl text-foreground-muted mb-10 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-600 text-white rounded-full px-8 h-12"
                asChild
              >
                <Link href="/auth/register">
                  {t('button_trial')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border rounded-full px-8 h-12 border-secondary hover:bg-secondary/10 bg-surface hover:text-secondary-600"
                asChild
              >
                <Link href="#pricing">{t('button_pricing')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
