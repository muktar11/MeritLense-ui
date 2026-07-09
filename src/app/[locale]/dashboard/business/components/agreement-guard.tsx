"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { AgreementType } from "@/app/api/agreements/types";

const REQUIRED_TYPES: AgreementType[] = ["B2B_AGREEMENT", "DPA"];
// Pages an unsigned company must still be able to reach directly from the
// sidebar: the sign-agreements flow itself, and Company Profile (which
// hosts the "Sign Agreements" entry point). Everything else stays gated.
const EXEMPT_SEGMENTS = ["/sign-agreements", "/company-profile"];

export function AgreementGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const isExemptPage = EXEMPT_SEGMENTS.some((segment) => pathname?.includes(segment)) ?? false;

  useEffect(() => {
    if (isExemptPage) {
      // Reset `blocked` too: a prior redirect attempt from a gated page
      // (e.g. candidates) must not keep this now-exempt page spinning
      // forever once the user navigates to it directly.
      setBlocked(false);
      setChecking(false);
      return;
    }

    let active = true;
    agreementService
      .getStatus()
      .then((agreements) => {
        if (!active) return;
        const signedTypes = new Set(
          agreements.filter((a) => a.status === "SIGNED").map((a) => a.agreement_type)
        );
        const allSigned = REQUIRED_TYPES.every((type) => signedTypes.has(type));
        if (!allSigned) {
          setBlocked(true);
          router.replace(`/${locale}/dashboard/business/sign-agreements`);
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        // Fail open on a transient API error rather than locking an already
        // signed company out of their dashboard over a network blip.
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [isExemptPage, locale, router]);

  if (isExemptPage) {
    return <>{children}</>;
  }

  if (checking || blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return <>{children}</>;
}
