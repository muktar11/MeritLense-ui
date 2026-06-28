"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth.schemas";
import { useAuth } from "../../../hooks/useAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1];
  
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false); // Track if token has been checked

  const { resetPassword, validateResetToken, loading, error } = useAuth();

  // Get token from URL
  const token = searchParams.get("token");

  // Use a ref to track if validation has been done
  const validationDone = useRef(false);

  // Validate token on mount - only once
  useEffect(() => {
    const checkToken = async () => {
      // Prevent multiple validations
      if (validationDone.current) return;
      
      if (!token) {
        setTokenValid(false);
        setTokenError("No reset token provided");
        setTokenChecked(true);
        validationDone.current = true;
        return;
      }

      try {
        const isValid = await validateResetToken(token);
        setTokenValid(isValid);
        if (!isValid) {
          setTokenError("This password reset link is invalid or has expired");
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError("Error validating reset token");
      } finally {
        setTokenChecked(true);
        validationDone.current = true;
      }
    };

    checkToken();
  }, [token, validateResetToken]); // Empty dependency array would be better, but we need token

  // Get translations
  const t = useTranslations("auth_page.reset_password");
  const errorT = useTranslations("zodErrors");

  const resetPasswordSchema = createResetPasswordSchema(errorT);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    const success = await resetPassword(token, data.newPassword, data.confirmPassword);
    setIsLoading(false);
    
    if (success) {
      setResetSuccess(true);
      
      // Clear any stored reset email
      localStorage.removeItem("resetPasswordEmail");
      
      // Don't re-validate token after success
      setTokenChecked(true);
      validationDone.current = true;
      
      // Redirect after delay
      setTimeout(() => router.push(`/${locale}/auth/login`), 3000);
    }
  };

  // Show loading only while checking token and token hasn't been checked yet
  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-white">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Validating your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenChecked && !tokenValid) {
    return (
      <div className="min-h-screen bg-white">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              {tokenError || "This password reset link is invalid or has expired."}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/${locale}/auth/forgot-password`)}
                className="w-full"
              >
                Request New Reset Link
              </Button>
              <Link
                href={`/${locale}/auth/login`}
                className="block text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("success_state.title")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("success_state.message")}
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Redirecting to login...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state from API (but only if not in success state)
  if (error && !resetSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => form.reset()}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form (token is valid)
  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("header.title")}
            </h1>
            <p className="text-gray-600">
              {t("header.subtitle")}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* New Password */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form.label_new_password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10" 
                            disabled={loading || isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 mt-1">
                        {t("form.password_hint")}
                      </p>
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form.label_confirm_password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10" 
                            disabled={loading || isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading || isLoading} 
                  className="w-full" 
                  size="lg"
                >
                  {loading || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("form.button_loading")}
                    </>
                  ) : (
                    t("form.button_reset")
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Back to Login */}
          <p className="mt-6 text-center text-sm text-gray-600">
            {t("link_login.prefix")}{" "}
            <Link 
              href={`/${locale}/auth/login`}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {t("link_login.link_text")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}