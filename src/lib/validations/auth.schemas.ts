import { z } from "zod";

type TranslationFunction = (key: string) => string;

export const createLoginSchema = (t: TranslationFunction) =>
  z.object({
    email: z.string().min(1, t("email_required")).email(t("email_invalid")),

    password: z.string().min(6, t("password_min")),

    rememberMe: z.boolean(),
  });

export const createRegisterB2CSchema = (t: TranslationFunction) =>
  z
    .object({
      fullName: z.string().min(2, t("full_name_min")),
      email: z.string().min(1, t("email_required")).email(t("email_invalid")),
      mobile: z.string().min(8, t("mobile_min")),
      country: z.string().min(1, t("country_required")),
      city: z.string().min(1, t("city_required")),
      preferredLanguage: z.enum(["en", "ar"]),
      password: z.string().min(8, t("password_min_8")),
      confirmPassword: z.string().min(1, t("confirm_password_required")),
      agreeToTerms: z.boolean().refine((val) => val === true, {
        message: t("agree_terms_required"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwords_not_match"),
      path: ["confirmPassword"],
    });

export const createRegisterB2BSchema = (t: TranslationFunction) =>
  z
    .object({
      country: z.string().min(1, t("country_required")),
      city: z.string().min(1, t("city_required")),
      preferredLanguage: z.enum(["en", "ar"]),
      password: z.string().min(8, t("password_min_8")),
      confirmPassword: z.string().min(1, t("confirm_password_required")),
      agreeToTerms: z.boolean().refine((val) => val === true, {
        message: t("agree_terms_required"),
      }),

      companyName: z.string().min(2, t("company_name_min")),
      managerName: z.string().min(2, t("manager_name_min")),
      licenseNumber: z.string().min(3, t("license_number_required")),
      officialEmail: z
        .string()
        .min(1, t("official_email_required"))
        .email(t("email_invalid")),
      companyPhone: z.string().min(8, t("company_phone_min")),
      commercialRegistration: z
        .instanceof(File)
        .optional()
        .refine(
          (file) => !file || file.size <= 5000000,
          "File size must be less than 5MB"
        )
        .refine(
          (file) =>
            !file ||
            ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
          "Only PDF, JPG, or PNG files are allowed"
        ),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwords_not_match"),
      path: ["confirmPassword"],
    });

export const createForgotPasswordSchema = (t: TranslationFunction) =>
  z.object({
    emailOrPhone: z
      .string()
      .min(1, t("email_or_phone_required"))
      .refine(
        (val) => {
          // Check if it's a valid email or phone number
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phoneRegex = /^[0-9+\-\s()]+$/;
          return emailRegex.test(val) || phoneRegex.test(val);
        },
        {
          message: t("email_or_phone_invalid"),
        }
      ),
  });

export const createResetPasswordSchema = (t: TranslationFunction) =>
  z
    .object({
      newPassword: z
        .string()
        .min(8, t("password_min_8"))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t("password_requirements")),
      confirmPassword: z.string().min(1, t("confirm_password_required")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwords_not_match"),
      path: ["confirmPassword"],
    });

export type ForgotPasswordFormData = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordFormData = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
export type RegisterB2CFormData = z.infer<
  ReturnType<typeof createRegisterB2CSchema>
>;
export type RegisterB2BFormData = z.infer<
  ReturnType<typeof createRegisterB2BSchema>
>;
export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;