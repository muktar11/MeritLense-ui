"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle } from 'lucide-react';
import paymentService from '@/app/api/payments/endpoints';
import type { Price } from '@/app/api/payments/types';
import { useLocale, useTranslations } from 'next-intl';

interface SubscriptionFormProps {
  price: Price;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SubscriptionForm({ price, onSuccess, onError }: SubscriptionFormProps) {
  const t = useTranslations('dashboard.indivisual.payment.subscriptionForm');
  const stripe = useStripe();
  const elements = useElements();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError(t('stripeNotInitialized'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/dashboard/indivisual/payment/success?type=subscription`,
        },
      });

      if (setupError) {
        throw new Error(setupError.message);
      }

      console.log('Setup intent completed:', setupIntent);

      const subscription = await paymentService.createSubscription({
        price_id: price.id,
        payment_method_id: setupIntent?.payment_method as string,
        quantity: 1
      });

      console.log('Subscription created:', subscription);

      onSuccess?.();

      window.location.href = `/${locale}/dashboard/indivisual/payment/success?type=subscription`;
      
    } catch (err: any) {
      console.error('Subscription error:', err);
      const errorMessage = err.message || err.detail || t('createFailedError');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-800 mb-2">{t('detailsHeading')}</h4>
        <p className="text-sm text-blue-700">
          {t('planLabel', { name: price.name })}<br />
          {t('priceLabel', { price: paymentService.formatPrice(Number(price.unit_amount), price.currency), interval: price.interval?.toLowerCase() ?? '' })}
        </p>
      </div>

      <PaymentElement />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('creatingButton')}
          </>
        ) : (
          t('subscribeButton')
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {t('chargeNote', { price: paymentService.formatPrice(Number(price.unit_amount), price.currency), interval: price.interval?.toLowerCase() ?? '' })}
      </p>
    </form>
  );
}