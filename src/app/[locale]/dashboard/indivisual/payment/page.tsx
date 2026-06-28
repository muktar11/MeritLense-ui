"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, AlertCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from "@/app/hooks/useAuth";
import paymentService from "@/app/api/payments/endpoints";
import type { Price } from "@/app/api/payments/types";
import { SubscriptionForm } from "../components/subscription-form";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const t = useTranslations("dashboard.indivisual.payment");
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Price | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlans();
    } else {
      setLoading(false);
      setError('Please log in to view plans');
    }
  }, [billingPeriod, isAuthenticated]);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getPricesForUser();
      console.log('Fetched plans:', data);
      
      const filteredPlans = data.filter(plan => {
        const interval = plan.interval?.toUpperCase() || '';
        
        if (billingPeriod === 'monthly') {
          return interval === 'MONTH' || interval === 'MONTHLY';
        } else {
          return interval === 'YEAR' || interval === 'YEARLY';
        }
      });
      
      console.log(`Filtered plans for ${billingPeriod}:`, filteredPlans);
      setPlans(filteredPlans);
    } catch (error: any) {
      console.error('Failed to fetch plans:', error);
      setError(error?.detail || error?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Price) => {
    setSelectedPlan(plan);
    setProcessing(true);
    setError(null);
    
    try {
      const setupIntent = await paymentService.createSetupIntent();
      setClientSecret(setupIntent.client_secret);
    } catch (error: any) {
      console.error('Failed to create setup intent:', error);
      setError(error?.detail || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    router.push('/dashboard/indivisual/payment/');
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setClientSecret(null);
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view and select plans.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error && !selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Plans</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            {t("subtitle")}
          </p>

          {!selectedPlan && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span
                className={`text-sm font-medium ${
                  billingPeriod === "monthly" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {t("billingMonthly")}
              </span>
              <button
                onClick={() =>
                  setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")
                }
                className="relative inline-flex h-8 w-14 items-center rounded-full bg-purple-500"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    billingPeriod === "annual" ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  billingPeriod === "annual" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {t("billingAnnual")}
              </span>
            </div>
          )}
        </div>

        {selectedPlan && clientSecret ? (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBackToPlans}
              className="text-purple-600 hover:text-purple-700 mb-4 inline-flex items-center gap-1"
            >
              ← Back to plans
            </button>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscriptionForm
                  price={selectedPlan}
                  onSuccess={handleSubscriptionSuccess}
                  onError={(err) => setError(err)}
                />
              </Elements>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {plans.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No plans available for {billingPeriod} billing</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Available intervals: MONTH (for monthly), YEAR (for annual)
                  </p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 transition-all p-6 sm:p-8 ${
                      selectedPlan?.id === plan.id
                        ? "border-purple-500 bg-white shadow-xl scale-105"
                        : "border-gray-200 bg-white hover:border-purple-200 hover:shadow-lg"
                    }`}
                  >
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      {plan.name}
                    </h3>

                    <div className="mb-4 sm:mb-6">
                      <span className="text-2xl sm:text-4xl font-bold text-gray-900">
                        {paymentService.formatPrice(Number(plan.unit_amount), plan.currency)}
                      </span>
                      <span className="text-gray-500 text-xs sm:text-sm ml-1 sm:ml-2">
                        /{plan.interval?.toLowerCase()}
                      </span>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                      {plan.feature_limits?.candidate_limit ? (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs sm:text-sm">
                            Up to {plan.feature_limits.candidate_limit} candidates
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs sm:text-sm">
                            Unlimited candidates
                          </span>
                        </div>
                      )}
                      
                      {plan.feature_limits?.evaluation_limit ? (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs sm:text-sm">
                            {plan.feature_limits.evaluation_limit} evaluations/month
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs sm:text-sm">
                            Unlimited evaluations
                          </span>
                        </div>
                      )}
                      
                      {plan.feature_limits?.team_member_limit ? (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs sm:text-sm">
                            Up to {plan.feature_limits.team_member_limit} team members
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                          <span className="text-gray-700 text-xs sm:text-sm">
                            Unlimited team members
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={processing}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition text-sm sm:text-base disabled:opacity-50"
                    >
                      {processing && selectedPlan?.id === plan.id ? 'Processing...' : 'Subscribe'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {error && selectedPlan && (
          <div className="max-w-md mx-auto mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}