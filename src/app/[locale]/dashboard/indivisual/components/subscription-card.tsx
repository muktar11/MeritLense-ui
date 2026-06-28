"use client";

import { Check } from 'lucide-react';
import type { Price } from '@/app/api/payments/types';
import paymentService from '@/app/api/payments/endpoints';
import { useAuth } from '@/app/hooks/useAuth';

interface SubscriptionCardProps {
  plan: Price;
  onSelect: (plan: Price) => void;
  isSelected?: boolean;
  currentPlan?: boolean;
  disabled?: boolean;
}

export function SubscriptionCard({
  plan,
  onSelect,
  isSelected = false,
  currentPlan = false,
  disabled = false
}: SubscriptionCardProps) {
  const { userRole } = useAuth();

  const getPlanLimits = () => {
    const limits = [];
    if (plan.feature_limits.candidate_limit) {
      limits.push(`Up to ${plan.feature_limits.candidate_limit} candidates`);
    }
    if (plan.feature_limits.evaluation_limit) {
      limits.push(`Up to ${plan.feature_limits.evaluation_limit} evaluations/month`);
    }
    if (plan.feature_limits.team_member_limit) {
      limits.push(`Up to ${plan.feature_limits.team_member_limit} team members`);
    }
    return limits;
  };

  const getPriceText = () => {
    const amount = paymentService.formatPrice(plan.unit_amount, plan.currency);
    const interval = paymentService.getIntervalText(plan.interval, plan.interval_count);
    return `${amount}/${interval}`;
  };

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all p-6 ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-lg'
          : currentPlan
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-purple-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onSelect(plan)}
    >
      {(isSelected || currentPlan) && (
        <div className="absolute -top-3 right-4">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full ${
              isSelected
                ? 'bg-purple-100 text-purple-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {isSelected ? 'Selected' : 'Current Plan'}
          </span>
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
      
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">
          {paymentService.formatPrice(plan.unit_amount, plan.currency)}
        </span>
        <span className="text-gray-500 text-sm ml-2">
          /{paymentService.getIntervalText(plan.interval, plan.interval_count)}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {getPlanLimits().map((limit, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{limit}</span>
          </div>
        ))}

        {plan.features && Object.entries(plan.features).map(([key, value], idx) => (
          <div key={idx} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{value}</span>
          </div>
        ))}
      </div>

      {!currentPlan && !isSelected && (
        <button
          onClick={() => onSelect(plan)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition disabled:opacity-50"
        >
          Select Plan
        </button>
      )}

      {currentPlan && (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Current Plan</span>
        </div>
      )}
    </div>
  );
}