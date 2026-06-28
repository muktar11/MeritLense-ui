"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

interface PaymentMethodFormProps {
  clientSecret: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  submitButtonText?: string;
}

export function PaymentMethodForm({
  clientSecret,
  onSuccess,
  onError,
  submitButtonText = 'Save Payment Method'
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const locale = useLocale();
  const elements = useElements();
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
      const { error: submitError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/dashboard/business/payment?setup_success=true`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      console.log('Setup successful:', setupIntent);
      
      if (setupIntent?.status === 'succeeded') {
        // Wait a moment for Stripe to process
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSuccess?.();
      } else {
        throw new Error('Setup did not complete successfully');
      }
      
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'An error occurred');
      onError?.(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
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