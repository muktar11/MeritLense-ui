"use client";

import { useState } from 'react';
import { CreditCard, Trash2, Star } from 'lucide-react';
import type { PaymentMethod } from '@/app/api/payments/types';
import paymentService from '@/app/api/payments/endpoints';

interface PaymentMethodsListProps {
  paymentMethods: PaymentMethod[];
  onMethodDeleted: () => void;
  onDefaultChanged: () => void;
}

export function PaymentMethodsList({
  paymentMethods,
  onMethodDeleted,
  onDefaultChanged
}: PaymentMethodsListProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleSetDefault = async (method: PaymentMethod) => {
    setLoading(method.id);
    try {
      await paymentService.setDefaultPaymentMethod(method.id);
      onDefaultChanged();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    
    setLoading(method.id);
    try {
      await paymentService.detachPaymentMethod(method.id);
      onMethodDeleted();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    } finally {
      setLoading(null);
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No payment methods added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={`flex items-center justify-between p-4 border rounded-lg ${
            method.is_default ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {method.card_brand} •••• {method.card_last4}
              </p>
              <p className="text-sm text-gray-500">
                Expires {method.card_exp_month}/{method.card_exp_year}
              </p>
            </div>
            {method.is_default && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Default
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!method.is_default && (
              <button
                onClick={() => handleSetDefault(method)}
                disabled={loading === method.id}
                className="p-2 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-gray-100"
                title="Set as default"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(method)}
              disabled={loading === method.id}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}