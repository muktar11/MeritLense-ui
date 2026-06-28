"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useMemo } from "react";
import { useInView } from "react-intersection-observer";

function useCountUp(target: number, durationMs = 1200, start = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(progress);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, durationMs, start]);

  return value;
}

export function Stats() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const t = useTranslations("landing-page.stats");

  const stats = useMemo(() => [
    { label: "active_users", value: 10000, suffix: "+" },
    { label: "evaluations", value: 50000, suffix: "+" },
    { label: "countries", value: 25, suffix: "+" },
    { label: "success_rate", value: 95, suffix: "%" },
  ], []);

  const animatedValues = stats.map(stat => useCountUp(stat.value, 1200, inView));
  const numberFmt = new Intl.NumberFormat();

  return (
    <section ref={ref} className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-foreground mb-2 tabular-nums">
                {numberFmt.format(animatedValues[idx])}{stat.suffix}
              </div>
              <div className="text-foreground-muted">{t(stat.label)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
