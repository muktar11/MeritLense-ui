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
  params: { locale: Locale };
}

// Server Component
export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
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
