"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { User, Building2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import ProgressStepper from "./components/auth/progress-stepper"

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("auth_page.register_selection")

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressStepper currentStep={0} />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t("header.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("header.subtitle")}</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push(`/${locale}/auth/register/candidate`)}
              className="w-full bg-white border-2 border-border p-6 rounded-xl text-left hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-foreground flex items-center justify-between">
                    {t("card_b2c.title")}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("card_b2c.description")}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push(`/${locale}/auth/register/employee`)}
              className="w-full bg-white border-2 border-border p-6 rounded-xl text-left hover:border-secondary hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                  <Building2 className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-foreground flex items-center justify-between">
                    {t("card_b2b.title")}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("card_b2b.description")}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            {t("link_login.prefix")}{" "}
            <Link
              href={`/${locale}/auth/login`}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t("link_login.link_text")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
