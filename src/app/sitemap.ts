import type { MetadataRoute } from "next";
import { locales } from "@/config/locales";

// The site is deployed as a static export (NEXT_PUBLIC_STATIC_EXPORT=true) -
// this route has to be pre-rendered at build time, not on-demand.
export const dynamic = "force-static";

const BASE_URL = "https://meritlense.com";

// Public marketing/legal pages only - the authenticated dashboard and
// account-specific flows (registration steps, agreement signing, etc.)
// aren't general-audience content and are kept out of the sitemap.
const PATHS: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    PATHS.map(({ path, priority }) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
        ),
      },
    }))
  );
}
