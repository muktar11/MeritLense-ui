"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import teamService from "@/app/api/team/endpoints";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}

function AcceptInvitationContent() {
  const t = useTranslations("auth_page.acceptInvitation");
  const router = useRouter();
  const locale = useLocale()
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError("No invitation token provided");
      setValidating(false);
      return;
    }

    if (token.length > 0) {
      setIsValidToken(true);
    }
    setValidating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("No invitation token provided");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await teamService.acceptInvitation({
        token,
        password,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      
      setTimeout(() => {
        router.push(`${locale}/auth/login`);
      }, 3000);

    } catch (err: any) {
      console.error("Accept invitation error:", err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat().join(', ');
          setError(errorMessages || "Failed to accept invitation");
        } else {
          setError(errorData || "Failed to accept invitation");
        }
      } else {
        setError(err.message || "Failed to accept invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating invitation...</h2>
          <p className="text-gray-600">Please wait while we verify your invitation.</p>
        </div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">
            The invitation link you provided is invalid or missing.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been successfully created. You will be redirected to the login page in 3 seconds.
          </p>
          <Link
            href={`${locale}/auth/login`}
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t("password")} *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t("confirmPassword")} *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                Passwords match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("accepting")}
              </>
            ) : (
              t("acceptInvitation")
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By accepting this invitation, you agree to our{" "}
            <Link href="/terms" className="text-purple-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}