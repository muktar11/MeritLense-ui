import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ✅ Enable static export automatically
  output: isStaticExport ? "export" : undefined,
  trailingSlash: isStaticExport, // optional: creates /en/index.html, /ar/index.html

  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
