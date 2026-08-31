// The landing page's registration CTAs ("Get Started", "Start Evaluating",
// "Start Your Free Trial", etc.) all link here - a fixed, absolute
// production URL (not a relative Next.js route) per explicit product
// request, so the link is identical regardless of which domain/preview
// deployment currently serves the page.
const SITE_URL = "https://meritlense.com";

export function getStartedUrl(locale: string): string {
  return `${SITE_URL}/${locale}/auth/register/`;
}
