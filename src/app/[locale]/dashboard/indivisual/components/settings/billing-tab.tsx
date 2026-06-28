"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Loader2, Building2 } from "lucide-react";
import { useSubscription } from "@/app/context/SubscriptionContext";
import paymentService from "@/app/api/payments/endpoints";
import type { PaymentMethod, Invoice } from "@/app/api/payments/types";
import { PaymentMethodsList } from "../payment-methods-list";
import { AddPaymentMethodModal } from "../add-payment-method-modal";
import { UsageMeter } from "../usage-meter";
import { format } from "date-fns";

export function BillingTab() {
  const t = useTranslations("dashboard.indivisual.settings.billing-tab");
  const locale = useLocale();
  const { subscription, usage, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [paymentAction, setPaymentAction] = useState<{requiresAction: boolean; url?: string} | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [methods, invoiceList] = await Promise.all([
        paymentService.getPaymentMethods(),
        paymentService.getInvoices()
      ]);
      setPaymentMethods(methods);
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodAdded = async () => {
    await fetchData();
    await refreshSubscription();
  };

  const handlePaymentMethodDeleted = async () => {
    await fetchData();
    await refreshSubscription();
  };

  const handleDefaultChanged = async () => {
    await fetchData();
    await refreshSubscription();
  };

  const handleCancelSubscription = async () => {
  if (!subscription) return;
  
  setCancelling(true);
  try {
    const result = await paymentService.cancelSubscription(subscription.id, {
      at_period_end: cancelAtPeriodEnd,
      cancellation_reason: cancelReason
    });
    
    console.log('Subscription cancelled:', result);
    
    await refreshSubscription();
    await fetchData();
    
    setShowCancelModal(false);
    setCancelReason('');
    
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    alert('Failed to cancel subscription. Please try again.');
  } finally {
    setCancelling(false);
  }
};

  const calculateDaysRemaining = (endDate: string | null | undefined): number => {
  if (!endDate) return 0;
  
  const end = new Date(endDate);
  const now = new Date();
  
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

  const checkStatus = async () => {
    try {
      const data = await paymentService.checkSubscriptions();
      setDebugInfo(data);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const checkAndHandlePayment = async () => {
    if (!subscription) return;
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/payments/retry-payment/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscription_id: subscription.id })
      });
      
      const data = await response.json();
      
      if (data.requires_action && data.hosted_invoice_url) {
        setPaymentAction({ requiresAction: true, url: data.hosted_invoice_url });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (!subscription) return;
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/payments/debug-payment/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data[0]?.hosted_invoice_url) {
        window.open(data[0].hosted_invoice_url, '_blank');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };

  const syncSubscription = async () => {
    if (!subscription) return;
    
    setSyncing(true);
    try {
      const data = await paymentService.syncSubscription(subscription.id);
      await refreshSubscription();
      await fetchData();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">Debug Info</h4>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          <button
            onClick={syncSubscription}
            disabled={syncing}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
          >
            {syncing ? 'Syncing...' : 'Sync This Subscription'}
          </button>
        </div>
      )}

      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            {t('companySubscription')}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">

        <button
          onClick={checkPaymentStatus}
          className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
          disabled={!subscription}
        >
          Check Payment
        </button>
      </div>

      {subscription ? (
        <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('currentPlan')}</h3>
              <p className="text-sm text-gray-600">
                {subscription.price_details?.name || subscription.stripe_price?.name || t('noActivePlan')} - {subscription.status_display}
              </p>
              {subscription.company_name && (
                <p className="text-xs text-gray-500 mt-1">
                  Company: {subscription.company_name}
                </p>
              )}
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {subscription.cancel_at_period_end ? t('cancelsAtPeriodEnd') : t('active')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500">{t('nextBillingDate')}</p>
              <p className="font-medium">
                {subscription.current_period_end 
                  ? format(new Date(subscription.current_period_end), 'MMM d, yyyy')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('amount')}</p>
              <p className="font-medium">
                {subscription.price_details 
                  ? paymentService.formatPrice(
                      Number(subscription.price_details.unit_amount),
                      subscription.price_details.currency
                    )
                  : subscription.stripe_price 
                  ? paymentService.formatPrice(
                      Number(subscription.stripe_price.unit_amount),
                      subscription.stripe_price.currency
                    )
                  : 'N/A'}
                {subscription.price_details?.interval && `/${subscription.price_details.interval.toLowerCase()}`}
                {!subscription.price_details && subscription.stripe_price?.interval && `/${subscription.stripe_price.interval.toLowerCase()}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('daysRemaining')}</p>
              <p className="font-medium">
                {calculateDaysRemaining(subscription.current_period_end)} {t('days')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('paymentMethod')}</p>
              <p className="font-medium">{subscription.payment_method || t('notSet')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">{t('noActiveSubscription')}</p>
          <a
            href={`/${locale}/dashboard/indivisual/payment`}
            className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {t('viewPlans')}
          </a>
        </div>
      )}

      {subscription && (
  <div className="flex items-center gap-2 mt-2">
    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
      {subscription.cancel_at_period_end ? t('cancelsAtPeriodEnd') : t('active')}
    </span>
    
    {!subscription.cancel_at_period_end && subscription.status?.toLowerCase() === 'active' && (
      <button
        onClick={() => setShowCancelModal(true)}
        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
      >
        Cancel Subscription
      </button>
    )}
    
    {subscription.cancel_at_period_end && (
      <button
        onClick={async () => {
          try {
            await paymentService.reactivateSubscription(subscription.id);
            await refreshSubscription();
          } catch (error) {
            console.error('Error reactivating subscription:', error);
          }
        }}
        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
      >
        Reactivate
      </button>
    )}
  </div>
)}

      {subscription?.status?.toLowerCase() === 'incomplete' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Action Required</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Your subscription is incomplete. Please complete the payment to activate your subscription.
          </p>
          <button
            onClick={checkAndHandlePayment}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Complete Payment
          </button>
          
          {paymentAction?.url && (
            <div className="mt-3">
              <a
                href={paymentAction.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Go to Payment Page
              </a>
            </div>
          )}
        </div>
      )}

      {usage && Object.keys(usage.usage_percentages).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('usage')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usage.usage_percentages.candidate_limit && (
              <UsageMeter
                used={usage.usage_percentages.candidate_limit.used}
                limit={usage.usage_percentages.candidate_limit.limit}
                label={t('candidates')}
              />
            )}
            {usage.usage_percentages.evaluation_limit && (
              <UsageMeter
                used={usage.usage_percentages.evaluation_limit.used}
                limit={usage.usage_percentages.evaluation_limit.limit}
                label={t('evaluations')}
              />
            )}
            {usage.usage_percentages.team_member_limit && (
              <UsageMeter
                used={usage.usage_percentages.team_member_limit.used}
                limit={usage.usage_percentages.team_member_limit.limit}
                label={t('teamMembers')}
              />
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('paymentMethods')}</h3>
          <button
            onClick={() => setIsAddMethodModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            {t('addPaymentMethod')}
          </button>
        </div>

        <PaymentMethodsList
          paymentMethods={paymentMethods}
          onMethodDeleted={handlePaymentMethodDeleted}
          onDefaultChanged={handleDefaultChanged}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('invoices')}</h3>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('date')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('invoiceNumber')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('amount')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('status')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('actions')}</th>
              </tr>
            </thead>

            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {t('noInvoices')}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="odd:bg-white even:bg-gray-50 border-t">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{invoice.number}</td>
                    <td className="px-4 py-3 font-medium">
                      {paymentService.formatPrice(invoice.amount_paid, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          invoice.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'OPEN'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPaymentMethodModal
        isOpen={isAddMethodModalOpen}
        onClose={() => setIsAddMethodModalOpen(false)}
        onSuccess={handlePaymentMethodAdded}
      />
    </div>
  );
}