"use client";

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { X, Loader2 } from 'lucide-react';
import { PaymentMethodForm } from './payment-method-form';
import paymentService from '@/app/api/payments/endpoints';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPaymentMethodModal({
  isOpen,
  onClose,
  onSuccess
}: AddPaymentMethodModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      createSetupIntent();
    } else {
      // Reset state when modal closes
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen]);

  const createSetupIntent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.createSetupIntent();
      console.log('Setup intent created:', response);
      setClientSecret(response.client_secret);
    } catch (err: any) {
      console.error('Failed to create setup intent:', err);
      setError(err?.message || 'Failed to initialize payment setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async () => {
    try {
      // First, refresh the payment methods
      await onSuccess();
      console.log('Payment methods refreshed successfully');
      
      // Small delay to ensure everything is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error after successful setup:', error);
      // Still close the modal even if refresh fails
      onClose();
    }
  };

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={handleClose} />
      
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md pointer-events-auto relative max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900">Add Payment Method</h3>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && !clientSecret && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-gray-600">Initializing payment form...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4">
              {error}
              <button 
                onClick={createSetupIntent}
                className="block mt-2 text-purple-600 hover:text-purple-700"
              >
                Try Again
              </button>
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentMethodForm
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onError={(err) => setError(err)}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}