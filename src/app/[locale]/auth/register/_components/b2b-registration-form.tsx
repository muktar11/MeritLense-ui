"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2, Mail, Lock, Building2, Phone } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CustomSelect } from "@/components/custom-ui/custom-select";

import {
  createRegisterB2BSchema,
  type RegisterB2BFormData,
} from "@/lib/validations/auth.schemas";
import { useTranslations, useLocale } from "next-intl"; // ✅ import useLocale

interface B2BRegistrationFormProps {
  onSubmit: (data: RegisterB2BFormData) => Promise<void>;
  onSwitchToB2C: () => void;
}

const countryOptions = ["usa", "uk", "sa"];
const languageOptions = ["en", "ar"];

export function B2BRegistrationForm({
  onSubmit,
  onSwitchToB2C,
}: B2BRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const errorMessage = useTranslations("zodErrors");

  const registerB2BSchema = createRegisterB2BSchema(errorMessage);

  const form = useForm<RegisterB2BFormData>({
    resolver: zodResolver(registerB2BSchema),
    defaultValues: {
      country: "",
      city: "",
      preferredLanguage: "en",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
      companyName: "",
      managerName: "",
      licenseNumber: "",
      officialEmail: "",
      companyPhone: "",
      commercialRegistration: undefined,
    },
  });

  const handleSubmit = async (data: RegisterB2BFormData) => {
    setIsLoading(true);
    await onSubmit(data);
    setIsLoading(false);
  };

  const t = useTranslations("auth_page.register_b2b");
  const locale = useLocale(); // ✅ get current locale
  return (
    <div className="w-full max-w-2xl mt-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("header.title")}
        </h1>
        <p className="text-gray-600">{t("header.subtitle")}</p>
      </div>

      {/* Form Card */}
      <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex justify-between p-8 pb-4 border-b border-gray-200 items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("card_header.title")}
            </h2>
            <p className="text-sm text-gray-600">{t("card_header.subtitle")}</p>
          </div>
          
          

            <button
            onClick={onSwitchToB2C}
            className="flex items-center text-secondary hover:text-secondary-700 mb-4"
          >
            {t("card_header.switch_to_b2c")}
          </button>

        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 p-8 pt-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {/* Company Information */}
              <div className="space-y-4">
                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form_fields.company_name.label")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder={t(
                              "form_fields.company_name.placeholder"
                            )}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manager Name */}
                <FormField 
                  control={form.control}
                  name="managerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form_fields.manager_name.label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            "form_fields.manager_name.placeholder"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country & City */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form_fields.country.label")}</FormLabel>
                        <FormControl>
                          <CustomSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={countryOptions.map((c) => {
                              return {
                                label: t(`select_options.countries.${c}`),
                                value: c,
                              };
                            })}
                            placeholder={t("form_fields.country.placeholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form_fields.city.label")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("form_fields.city.placeholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* License Number */}
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form_fields.license_number.label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            "form_fields.license_number.placeholder"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Official Email */}
                <FormField
                  control={form.control}
                  name="officialEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form_fields.official_email.label")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder={t(
                              "form_fields.official_email.placeholder"
                            )}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Phone */}
                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form_fields.company_phone")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="+1234567890"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commercialRegistration"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Commercial Registration</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);
                          }}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, or PNG (Max 5MB)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form_fields.preferred_language.label")}
                      </FormLabel>
                      <FormControl>
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={languageOptions.map((lang) => {
                            return {
                              label: t(`select_options.languages.${lang}`),
                              value: lang,
                            };
                          })}
                          placeholder={t(
                            "form_fields.preferred_language.placeholder"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form_fields.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form_fields.confirm_password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-8 pt-4 border-t border-gray-200 bg-white/90">
              <div className="space-y-4">
                {/* Agree to Terms */}
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {t("form_fields.agree_to_terms")}
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("buttons.loading")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      {t("buttons.create_account")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
{/* Login Link with dynamic locale */}
      <p className="mt-6 text-center text-sm text-gray-600">
        {t("link_login.prefix")}{" "}
        <Link
          href={`/${locale}/auth/login`} // ✅ locale-aware login link
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          {t("link_login.link_text")}
        </Link>
      </p>
    </div>
  );
}
