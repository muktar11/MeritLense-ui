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
import type { Price, Subscription, UsageResponse } from "@/app/api/payments/types";
import { SubscriptionForm } from "../components/subscription-form";
import { OneTimePaymentForm } from "../components/one-time-payment-form";
import { UsageMeter } from "../components/usage-meter";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const t = useTranslations("dashboard.indivisual.payment");
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [allPlans, setAllPlans] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Price | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [currentUsage, setCurrentUsage] = useState<UsageResponse | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlans();
      fetchCurrentSubscription();
    } else {
      setLoading(false);
      setSubLoading(false);
      setError('Please log in to view plans');
    }
  }, [isAuthenticated]);

  const fetchCurrentSubscription = async () => {
    setSubLoading(true);
    try {
      const subs = await paymentService.getActiveSubscriptions();
      if (subs && subs.length > 0) {
        const sorted = [...subs].sort((a, b) =>
          new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime()
        );
        const full = await paymentService.getSubscription(sorted[0].id);
        // One-time "points" purchases are bookkeeping rows, not a real recurring
        // subscription — nothing to display/upgrade here for those.
        if (full.price_details?.billing_type !== 'ONE_TIME') {
          setCurrentSubscription(full);
          try {
            const usage = await paymentService.getSubscriptionUsage(full.id);
            setCurrentUsage(usage);
          } catch (usageError) {
            console.error('Failed to fetch usage:', usageError);
            setCurrentUsage(null);
          }
        } else {
          setCurrentSubscription(null);
          setCurrentUsage(null);
        }
      } else {
        setCurrentSubscription(null);
        setCurrentUsage(null);
      }
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      setCurrentSubscription(null);
      setCurrentUsage(null);
    } finally {
      setSubLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getPricesForUser();
      setAllPlans(data);
    } catch (error: any) {
      console.error('Failed to fetch plans:', error);
      setError(error?.detail || error?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const recurringPlans = allPlans.filter(plan => {
    if (plan.billing_type === 'ONE_TIME') return false;
    const interval = plan.interval?.toUpperCase() || '';
    if (billingPeriod === 'monthly') {
      return interval === 'MONTH' || interval === 'MONTHLY';
    }
    return interval === 'YEAR' || interval === 'YEARLY';
  });

  const oneTimePlans = allPlans.filter(plan => plan.billing_type === 'ONE_TIME');

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

  const handleSelectOneTimePlan = async (plan: Price) => {
    setSelectedPlan(plan);
    setProcessing(true);
    setError(null);

    try {
      const intent = await paymentService.createPaymentIntent({ price_id: plan.id });
      setClientSecret(intent.client_secret);
    } catch (error: any) {
      console.error('Failed to create payment intent:', error);
      setError(error?.detail || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  const handleUpgradePlan = async (plan: Price) => {
    if (!currentSubscription) return;
    setSelectedPlan(plan);
    setUpgrading(true);
    setError(null);
    setUpgradeMessage(null);

    try {
      await paymentService.changePlan(currentSubscription.id, { price_id: plan.id, prorate: true });
      await fetchCurrentSubscription();
      setShowPlanPicker(false);
      setUpgradeMessage(`Your plan has been changed to ${plan.name}.`);
    } catch (error: any) {
      console.error('Failed to change plan:', error);
      setError(error?.detail || error?.error || 'Failed to change plan. Please try again.');
    } finally {
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const handleSubscriptionSuccess = () => {
    router.push('/dashboard/indivisual/payment/success?type=subscription');
  };

  const handleOneTimePaymentSuccess = () => {
    router.push('/dashboard/indivisual/payment/success?type=payment');
  };

  const calculateDaysRemaining = (endDate: string | null | undefined): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
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

  if (loading || subLoading) {
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

          {!selectedPlan && !(currentSubscription && !showPlanPicker) && (
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

        {upgradeMessage && (
          <div className="max-w-md mx-auto mb-8 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center">
            {upgradeMessage}
          </div>
        )}

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
                {selectedPlan.billing_type === 'ONE_TIME' ? (
                  <OneTimePaymentForm
                    price={selectedPlan}
                    onSuccess={handleOneTimePaymentSuccess}
                    onError={(err) => setError(err)}
                  />
                ) : (
                  <SubscriptionForm
                    price={selectedPlan}
                    onSuccess={handleSubscriptionSuccess}
                    onError={(err) => setError(err)}
                  />
                )}
              </Elements>
            </div>
          </div>
        ) : currentSubscription && !showPlanPicker ? (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentSubscription.price_details?.name || 'Unknown'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {currentSubscription.price_details
                      ? paymentService.formatPrice(
                          Number(currentSubscription.price_details.unit_amount),
                          currentSubscription.price_details.currency
                        )
                      : ''}
                    {currentSubscription.price_details?.interval &&
                      `/${currentSubscription.price_details.interval.toLowerCase()}`}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium whitespace-nowrap">
                  {currentSubscription.status_display || currentSubscription.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500">Next Billing Date</p>
                  <p className="font-medium text-gray-900">
                    {currentSubscription.current_period_end
                      ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Days Remaining</p>
                  <p className="font-medium text-gray-900">
                    {calculateDaysRemaining(currentSubscription.current_period_end)} days
                  </p>
                </div>
              </div>

              {currentUsage && Object.keys(currentUsage.usage_percentages).length > 0 && (
                <div className="space-y-4 mb-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Remaining This Period</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentUsage.usage_percentages.candidate_limit && (
                      <UsageMeter
                        used={currentUsage.usage_percentages.candidate_limit.used}
                        limit={currentUsage.usage_percentages.candidate_limit.limit}
                        label="Candidates"
                        unit="candidates"
                      />
                    )}
                    {currentUsage.usage_percentages.evaluation_limit && (
                      <UsageMeter
                        used={currentUsage.usage_percentages.evaluation_limit.used}
                        limit={currentUsage.usage_percentages.evaluation_limit.limit}
                        label="Evaluations"
                        unit="evaluations"
                      />
                    )}
                    {currentUsage.usage_percentages.team_member_limit && (
                      <UsageMeter
                        used={currentUsage.usage_percentages.team_member_limit.used}
                        limit={currentUsage.usage_percentages.team_member_limit.limit}
                        label="Team Members"
                        unit="team members"
                      />
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => { setShowPlanPicker(true); setError(null); setUpgradeMessage(null); }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  Upgrade Plan
                </button>
                <Link
                  href="/dashboard/indivisual/profile?tab=billing"
                  className="flex-1 text-center border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition"
                >
                  Manage Billing
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentSubscription && showPlanPicker && (
              <div className="max-w-2xl mx-auto mb-6 text-center">
                <button
                  onClick={() => { setShowPlanPicker(false); setError(null); }}
                  className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                >
                  ← Back to current plan
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {recurringPlans.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No plans available for {billingPeriod} billing</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Available intervals: MONTH (for monthly), YEAR (for annual)
                  </p>
                </div>
              ) : (
                recurringPlans.map((plan) => (
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
                      onClick={() => (currentSubscription ? handleUpgradePlan(plan) : handleSelectPlan(plan))}
                      disabled={processing || upgrading || currentSubscription?.price_details?.id === plan.id}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition text-sm sm:text-base disabled:opacity-50"
                    >
                      {(processing || upgrading) && selectedPlan?.id === plan.id
                        ? 'Processing...'
                        : currentSubscription?.price_details?.id === plan.id
                        ? 'Current Plan'
                        : currentSubscription
                        ? 'Upgrade'
                        : 'Subscribe'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {oneTimePlans.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                  One-Time Points Packages
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Buy points once — no subscription, no recurring charge.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {oneTimePlans.map((plan) => (
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
                        <span className="text-gray-500 text-xs sm:text-sm ml-1 sm:ml-2">one-time</span>
                      </div>

                      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                        {plan.feature_limits?.points_granted ? (
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                            <span className="text-gray-700 text-xs sm:text-sm">
                              {plan.feature_limits.points_granted} points
                            </span>
                          </div>
                        ) : null}
                        {plan.evaluation_tier && (
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
                            <span className="text-gray-700 text-xs sm:text-sm">
                              {plan.evaluation_tier === 'SCREENING' ? 'Screening evaluation' : 'Full evaluation'}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectOneTimePlan(plan)}
                        disabled={processing}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition text-sm sm:text-base disabled:opacity-50"
                      >
                        {processing && selectedPlan?.id === plan.id ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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