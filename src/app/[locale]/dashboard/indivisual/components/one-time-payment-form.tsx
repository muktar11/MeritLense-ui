"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Price } from '@/app/api/payments/types';
import { useLocale } from 'next-intl';

interface OneTimePaymentFormProps {
  price: Price;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function OneTimePaymentForm({ price, onSuccess, onError }: OneTimePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/dashboard/indivisual/payment/success?type=payment`,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      onSuccess?.();

      window.location.href = `/${locale}/dashboard/indivisual/payment/success?type=payment`;
    } catch (err: any) {
      console.error('One-time payment error:', err);
      const errorMessage = err.message || err.detail || 'Failed to complete payment';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pointsGranted = price.feature_limits?.points_granted;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-800 mb-2">Package Details</h4>
        <p className="text-sm text-blue-700">
          Package: {price.name}<br />
          Price: {price.currency?.toUpperCase()} {Number(price.unit_amount).toFixed(2)} (one-time)
          {pointsGranted ? <><br />Points: {pointsGranted}</> : null}
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
            Processing Payment...
          </>
        ) : (
          'Pay Now'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You will be charged {price.currency?.toUpperCase()} {Number(price.unit_amount).toFixed(2)} once. This package does not renew automatically.
      </p>
    </form>
  );
}
