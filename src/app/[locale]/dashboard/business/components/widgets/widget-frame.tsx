"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WidgetFrameProps {
  title: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  children: () => ReactNode;
}

// Placeholder card shown in a widget's slot while its data loads or after
// it fails, so the grid keeps its shape instead of jumping around.
export function WidgetFrame({ title, loading, error, onRetry, children }: WidgetFrameProps) {
  const t = useTranslations("dashboard.business.overview");
  const locale = useLocale();

  if (!loading && !error) return <>{children()}</>;

  return (
    <Card className="bg-white border-gray-100 h-full" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-gray-500" role="status">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
          ) : (
            <>
              <p>{t("widgetError")}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {t("retry")}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
