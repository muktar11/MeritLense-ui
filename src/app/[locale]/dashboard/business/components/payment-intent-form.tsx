"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

interface PaymentIntentFormProps {
  clientSecret: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  submitButtonText?: string;
  amount?: number;
  currency?: string;
}

export function PaymentIntentForm({
  clientSecret,
  onSuccess,
  onError,
  submitButtonText = 'Pay Now',
  amount,
  currency = 'eur'
}: PaymentIntentFormProps) {
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/dashboard/indivisual/success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred');
      onError?.(submitError.message || 'An error occurred');
    } else {
      onSuccess?.();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {amount && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.toUpperCase()
            }).format(amount)}
          </p>
        </div>
      )}

      <PaymentElement />
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
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
            Processing...
          </>
        ) : (
          submitButtonText
        )}
      </button>
    </form>
  );
}