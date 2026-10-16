"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { FileSignature, X } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { AgreementType } from "@/app/api/agreements/types";

// Shown when an agreement the account has signed has a newer version
// (e.g. one signed before the final legal text). Signing the current
// version is offered, not forced: the dashboard keeps working, and the
// earlier signed PDF stays as the record of what was signed then.
export function UpdatedAgreementsNotice({
  types,
  signPath,
}: {
  types: AgreementType[];
  signPath: string;
}) {
  const t = useTranslations("shared.updatedAgreements");
  const locale = useLocale();
  const pathname = usePathname();
  const [outdated, setOutdated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const typesKey = types.join(",");

  useEffect(() => {
    let active = true;
    agreementService
      .getStatus()
      .then((agreements) => {
        if (!active) return;
        setOutdated(
          agreements.some(
            (a) => typesKey.split(",").includes(a.agreement_type) && a.status === "SIGNED" && a.is_current === false
          )
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [typesKey, pathname]);

  if (!outdated || dismissed || pathname.includes("/sign-agreements")) return null;

  return (
    <div className="my-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="status">
      <FileSignature className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t("title")}</p>
        <p className="mt-0.5 text-sm">{t("body")}</p>
        <Link
          href={`/${locale}${signPath}`}
          className="mt-2 inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          {t("action")}
        </Link>
      </div>
      <button type="button" onClick={() => setDismissed(true)} aria-label={t("dismiss")} className="rounded p-1 hover:bg-amber-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
