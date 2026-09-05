"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const t = useTranslations("dashboard.indivisual.payment.success");
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);

  const type = searchParams.get('type') || 'subscription';

  useEffect(() => {
    setLoading(false);
    const timer = setTimeout(() => {
      router.push(`/${locale}/dashboard/indivisual/profile?tab=billing`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, locale]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("processingTitle")}
            </h1>
            <p className="text-gray-600">
              {type === 'subscription' ? t("confirmingSubscription") : t("confirmingPayment")}
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {type === 'subscription' ? t("subscriptionActivatedTitle") : t("paymentSuccessfulTitle")}
            </h1>

            <p className="text-gray-600 mb-8">
              {type === 'subscription'
                ? t("subscriptionActivatedMessage")
                : t("paymentSuccessfulMessage")}
            </p>

            <div className="space-y-3">
              <Link
                href={`/${locale}/dashboard/indivisual`}
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {t("goToDashboard")}
              </Link>

              <Link
                href={`/${locale}/dashboard/indivisual/profile?tab=billing`}
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t("viewBillingDetails")}
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              {t("redirecting")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}