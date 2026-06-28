
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import paymentService from '@/app/api/payments/endpoints';
import type { Subscription, UsageResponse } from '@/app/api/payments/types';

interface SubscriptionContextType {
  subscription: Subscription | null;
  usage: UsageResponse | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  checkFeatureLimit: (feature: string, increment?: number) => boolean;
  canAddCandidate: boolean;
  canAddEvaluation: boolean;
  canAddTeamMember: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { userRole, isAuthenticated, userId } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const subscriptions = await paymentService.getAllSubscriptions();
      
      if (subscriptions && subscriptions.length > 0) {
        const sortedSubs = [...subscriptions].sort((a, b) => 
          new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime()
        );
        
        const fullSubscription = await paymentService.getSubscription(sortedSubs[0].id);
        setSubscription(fullSubscription);
        
        try {
          const usageData = await paymentService.getSubscriptionUsage(sortedSubs[0].id);
          setUsage(usageData);
        } catch (usageError) {
          console.error('Failed to fetch usage:', usageError);
          setUsage(null);
        }
      } else {
        setSubscription(null);
        setUsage(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription, userRole]);

  const checkFeatureLimit = useCallback((feature: string, increment: number = 1): boolean => {
    if (!subscription) return false;
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') return true;
    
    const limit = subscription.price_details?.feature_limits?.[feature];
    if (!limit) return true;
    
    const current = subscription.current_usage?.[feature] || 0;
    return (current + increment) <= limit;
  }, [subscription, userRole]);

  const canAddCandidate = checkFeatureLimit('candidate_limit');
  const canAddEvaluation = checkFeatureLimit('evaluation_limit');
  const canAddTeamMember = checkFeatureLimit('team_member_limit');

  const value = {
    subscription,
    usage,
    loading,
    refreshSubscription,
    checkFeatureLimit,
    canAddCandidate,
    canAddEvaluation,
    canAddTeamMember,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}