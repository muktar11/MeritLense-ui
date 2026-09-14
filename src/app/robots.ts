import type { MetadataRoute } from "next";

// The site is deployed as a static export (NEXT_PUBLIC_STATIC_EXPORT=true) -
// this route has to be pre-rendered at build time, not on-demand.
export const dynamic = "force-static";

const BASE_URL = "https://meritlense.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The authenticated dashboards have nothing for a crawler to index
        // and shouldn't surface in search results. Registration/login stay
        // crawlable - they're the landing page's own "Get Started" CTAs.
        disallow: ["/en/dashboard/", "/ar/dashboard/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
