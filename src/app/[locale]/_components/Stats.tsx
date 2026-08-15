"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Mic, Globe2 } from "lucide-react";

export function Stats() {
  const t = useTranslations("landing-page.stats");

  const numberStats = useMemo(() => [
    { label: "role_packages", value: 21, suffix: "" },
    { label: "workforce_sectors", value: 11, suffix: "" },
  ], []);

  const iconStats = useMemo(() => [
    { label: "voice_evaluation", icon: Mic },
    { label: "multilingual_gcc", icon: Globe2 },
  ], []);

  const numberFmt = new Intl.NumberFormat();

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {numberStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-foreground mb-2 tabular-nums">
                {numberFmt.format(stat.value)}{stat.suffix}
              </div>
              <div className="text-foreground-muted">{t(stat.label)}</div>
            </div>
          ))}
          {iconStats.map((stat) => (
            <div key={stat.label} className="text-center flex flex-col items-center">
              <stat.icon className="h-10 w-10 lg:h-12 lg:w-12 text-primary mb-2" />
              <div className="text-foreground-muted">{t(stat.label)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
