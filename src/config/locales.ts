// src/config/locales.ts
export const locales = ["en", "ar"] as const; // added Arabic
export type Locale = (typeof locales)[number];

// RTL locales (Arabic is RTL)
export const rtlLocales: Locale[] = ["ar"];
