"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../../hooks/useAuth";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth_page.forgot_password");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1];

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // New state to track submission
  const { forgotPassword, loading, error } = useAuth();

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    const success = await forgotPassword(email);
    
    if (success) {
      // Store email for reference (optional)
      localStorage.setItem("resetPasswordEmail", email);
      // Set submitted state to true to show success message
      setIsSubmitted(true);
    }
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setEmail("");
  };

  // Show form if not submitted
  if (!isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={handleTryAgain}
                    className="text-sm text-red-600 font-medium hover:text-red-700 mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {t("header.title")}
              </h1>
              <p className="text-gray-600">
                {t("header.subtitle")}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("form.label_email_or_phone") || "Email Address"}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("form.placeholder_email_or_phone")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  required
                  disabled={loading}
                  className={`w-full ${emailError ? 'border-red-500' : ''}`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("form.button_loading")}
                  </>
                ) : (
                  t("form.button_send_link")
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                <Link 
                  href={`/${locale}/auth/login`} 
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {t("link_back_to_login")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state only after successful submission
  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {/* Success State */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("confirmation.title")}
            </h1>
            <p className="text-gray-600 mb-2">
              {t("confirmation.message_part1")} <span className="font-medium text-gray-900">{email}</span>
            </p>
            <p className="text-gray-600 mb-6">
              {t("confirmation.spam_check")}
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => router.push(`/${locale}/auth/login`)}
                className="w-full"
                variant="outline"
              >
                {t("link_back_to_login")}
              </Button>
              
              <p className="text-sm text-gray-500">
                Didn't receive the email?{" "}
                <button
                  onClick={handleTryAgain}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}