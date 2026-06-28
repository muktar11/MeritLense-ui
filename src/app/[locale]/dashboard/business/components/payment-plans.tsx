"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentPlans() {
  const t = useTranslations("dashboard.business.payment");
  const locale = useLocale();

  const [billingPeriod, setBillingPeriod] =
    useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      key: "starter",
      price: 1000,
      features: [
        "eval5",
        "essentialAdvanced",
        "pdfReports",
        "employerSummary",
        "simulation",
        "referenceVerification",
      ],
    },
    {
      key: "growth",
      price: 2000,
      highlighted: true,
      features: [
        "eval50",
        "dashboardAnalytics",
        "simulationTests",
        "referenceVerification",
        "comprehensionResilience",
        "benchmarking",
        "videoIntro",
        "smartInsights",
        "jobMatching",
      ],
    },
    {
      key: "business",
      price: 3500,
      features: [
        "eval100",
        "addonDiscount",
        "automations",
        "auditLogs",
        "personalitySnapshot",
        "behavioralModels",
        "regulatoryMode",
      ],
    },
    {
      key: "enterprise",
      price: null,
      features: [
        "unlimitedEval",
        "unlimitedAddons",
        "discount",
        "multiAgency",
        "customFeatures",
      ],
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#f7f7fb] px-4 sm:px-6 lg:px-10 py-8 sm:py-10"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 sm:mb-3">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-sm text-gray-600">{t("billMonthly")}</span>

            <button
              onClick={() =>
                setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")
              }
              className={`relative w-12 h-6 rounded-full transition ${
                billingPeriod === "annual" ? "bg-violet-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  billingPeriod === "annual" ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>

            <span className="text-sm text-gray-600">{t("billAnnually")}</span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl bg-white p-5 sm:p-6 flex flex-col h-full
                border border-gray-300
                ${
                  plan.highlighted
                    ? "border-2 border-violet-600 shadow-lg scale-[1.03]"
                    : "shadow-sm"
                }`}
            >
              {/* Header */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  {t(`plans.${plan.key}.name`)}
                </h3>

                {plan.price ? (
                  <div className="mb-4 sm:mb-5">
                    <span className="text-xl sm:text-2xl font-semibold text-gray-900">
                      €{plan.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {" "}
                      /{t("month")}
                    </span>
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">
                    {t("custom")}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2 flex-1 overflow-auto">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-violet-600 mt-1" />
                    <span className="text-sm sm:text-base text-gray-600 leading-snug">
                      {t(`features.${feature}`)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <Button
                variant="outline"
                className="mt-5 sm:mt-6 border-violet-500 text-violet-600 hover:bg-violet-50"
              >
                {t("getStarted")}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
