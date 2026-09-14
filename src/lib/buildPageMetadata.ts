import type { Metadata } from "next";
import { locales } from "@/config/locales";

const BASE_URL = "https://meritlense.com";
const OG_IMAGE = { url: "/images/Hero.png", width: 1024, height: 1024 };

// Next.js does NOT deep-merge a page's `openGraph`/`twitter`/`alternates`
// with its parent layout's - whichever level sets the key replaces the
// whole object. Building every page's metadata through this one helper
// keeps each of those objects complete (image, siteName, hreflang
// alternates, etc.) instead of silently losing fields to that replacement.
export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
}: {
  locale: string;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  const url = `/${locale}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: {
      type: "website",
      siteName: "MeritLense",
      title,
      description,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      url,
      images: [{ ...OG_IMAGE, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
    robots: { index: true, follow: true },
  };
}

export { BASE_URL };
