"use client";

import { useContentProtection } from "@/lib/content-protection";

/**
 * Mounted once in the root locale layout so every page - public and
 * authenticated alike - gets the same baseline copy-protection deterrents
 * without each page needing to opt in individually. See
 * lib/content-protection.ts for what this does and doesn't cover.
 */
export function ContentProtectionProvider() {
  useContentProtection();
  return null;
}
