"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { AgreementType } from "@/app/api/agreements/types";

const REQUIRED_TYPES: AgreementType[] = ["B2C_AGREEMENT"];
// Pages an unsigned individual employer must still be able to reach
// directly from the sidebar: the sign-agreements flow itself, and the
// Profile page (which hosts the "Sign Agreement" entry point). Everything
// else stays gated.
export const AGREEMENT_EXEMPT_SEGMENTS = ["/sign-agreements", "/profile"];

export type AgreementSignedState = "checking" | "signed" | "unsigned";

/** Single source of truth for whether the individual employer has signed the
 * B2C Agreement - shared by AgreementGuard (routing) and the sidebar
 * (disabling links), so both agree and only one status call is made per
 * layout mount. */
export function useB2CAgreementStatus(): AgreementSignedState {
  const [state, setState] = useState<AgreementSignedState>("checking");

  useEffect(() => {
    let active = true;
    agreementService
      .getStatus()
      .then((agreements) => {
        if (!active) return;
        const signedTypes = new Set(
          agreements.filter((a) => a.status === "SIGNED").map((a) => a.agreement_type)
        );
        const allSigned = REQUIRED_TYPES.every((type) => signedTypes.has(type));
        setState(allSigned ? "signed" : "unsigned");
      })
      .catch(() => {
        // Fail open on a transient API error rather than locking an already
        // signed user out of their dashboard over a network blip.
        if (active) setState("signed");
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function AgreementGuard({
  children,
  status,
}: {
  children: React.ReactNode;
  status: AgreementSignedState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const isExemptPage = AGREEMENT_EXEMPT_SEGMENTS.some((segment) => pathname?.includes(segment)) ?? false;

  useEffect(() => {
    if (isExemptPage || status !== "unsigned") return;
    router.replace(`/${locale}/dashboard/indivisual/sign-agreements`);
  }, [isExemptPage, locale, router, status]);

  if (isExemptPage) {
    return <>{children}</>;
  }

  if (status === "checking" || status === "unsigned") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return <>{children}</>;
}
