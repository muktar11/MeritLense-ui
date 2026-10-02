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
export const AGREEMENT_EXEMPT_SEGMENTS = ["/sign-agreements", "/company-profile"];

export type AgreementSignedState = "checking" | "signed" | "unsigned";

/** Single source of truth for whether the company has signed both the B2B
 * Agreement and DPA - shared by AgreementGuard (routing) and the sidebar
 * (disabling links), so both agree and only one status call is made per
 * route. Re-checks on every pathname change, not just once on mount: this
 * layout stays mounted across the sign-agreements -> dashboard transition
 * (both are children of the same layout), so a mount-only fetch would keep
 * reporting "unsigned" forever after a successful sign and bounce the user
 * straight back to Sign Agreements.
 *
 * A B2B_TEAM_MEMBER is exempt entirely, not just scoped differently: the
 * B2B Agreement and DPA are signed once by the company (the account owner),
 * never per-member - GET /agreements/status only ever returns the
 * *requesting user's own* Agreement rows, so a team member's own rows are
 * always empty and this used to redirect every team member to
 * sign-agreements permanently, regardless of the company's real status.
 * A team member's access is controlled by their invite-time permissions
 * instead (see team-member-profile.permissions), not by signing anything. */
export function useB2BAgreementStatus(role?: string | null): AgreementSignedState {
  const [state, setState] = useState<AgreementSignedState>("checking");
  const pathname = usePathname();
  const isTeamMember = role === "B2B_TEAM_MEMBER";

  useEffect(() => {
    if (isTeamMember) {
      setState("signed");
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
        setState(allSigned ? "signed" : "unsigned");
      })
      .catch(() => {
        // Fail open on a transient API error rather than locking an already
        // signed company out of their dashboard over a network blip.
        if (active) setState("signed");
      });
    return () => {
      active = false;
    };
  }, [pathname, isTeamMember]);

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
    router.replace(`/${locale}/dashboard/business/sign-agreements`);
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
