"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const type = searchParams.get('type') || 'subscription';

  useEffect(() => {
    setLoading(false);
    const timer = setTimeout(() => {
      router.push('/dashboard/business/payment?tab=billing');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processing...
            </h1>
            <p className="text-gray-600">
              Please wait while we confirm your {type}.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {type === 'subscription' ? 'Subscription Activated!' : 'Payment Successful!'}
            </h1>
            
            <p className="text-gray-600 mb-8">
              {type === 'subscription' 
                ? 'Your subscription has been activated successfully. You can now access all features of your plan.'
                : 'Thank you for your payment. Your transaction has been completed successfully.'}
            </p>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Go to Dashboard
              </Link>
              
              <Link
                href="/dashboard/business/payment?tab=billing"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                View Billing Details
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Redirecting to billing in 3 seconds...
            </p>
          </>
        )}
      </div>
    </div>
  );
}