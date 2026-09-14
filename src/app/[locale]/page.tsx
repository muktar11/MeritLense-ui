import { getTranslations } from "next-intl/server";
import { type Locale } from "@/config/locales";
import {
  Navbar,
  Hero,
  Stats,
  Features,
  HowItWorks,
  Pricing,
  CTA,
  Footer,
} from "./_components"; // adjust the path to your components

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

// No generateMetadata here - the homepage is the site's default page, so it
// just inherits the [locale] layout's full metadata (title, OG/Twitter
// images, hreflang alternates) as-is. A page-level override here would
// replace those objects instead of merging into them (see
// buildPageMetadata.ts), so the layout's is deliberately left untouched.

// Real, current facts only (from Stats.tsx / landing copy) - avoid inventing
// figures (ratings, pricing, founding dates) that aren't in the codebase.
function organizationJsonLd(locale: Locale, title: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "MeritLense",
        "url": "https://meritlense.com",
        "logo": "https://meritlense.com/logo.png",
        "description": description,
        // The platform's actual official profiles (from Footer.tsx) - this
        // is one of the real signals Google's Knowledge Graph uses to
        // recognize an entity; it doesn't by itself produce a Knowledge
        // Panel (that also needs independent third-party verification).
        "sameAs": [
          "https://www.linkedin.com/company/meritlense/",
          "https://x.com/LensMerit",
          "https://www.instagram.com/meritlense/",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "name": "MeritLense",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": `https://meritlense.com/${locale}`,
        "description": description,
        "inLanguage": locale,
      },
    ],
  };
}

// Server Component
export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shared.pageMeta.siteDefault" });

  return (
    <div className="bg-white text-gray-900">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(locale, t("title"), t("description"))),
        }}
      />
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

// ✅ Static export for supported locales
export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
