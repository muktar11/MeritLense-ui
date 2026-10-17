// Candidate interview page in the candidate's own language.
//
// English and Arabic are written in candidate-lang.ts / language-strings.ts.
// Every other supported language is a plain JSON file in ./locales (same
// keys, with {placeholders}), so translators can review and correct it
// without touching code. A language is loaded only when a candidate needs
// it. Typing each import as CandidateMessages makes a missing key a build
// error rather than blank text on the page.
//
// The consent and privacy texts in these files are translations shown to
// the candidate in place of the English/Arabic originals (management
// decision, 14 Oct 2026). The language shown is recorded with the consent.
import { setCookieBannerLanguage } from "@/lib/cookie-banner-language";
import { buildCandidateStrings, buildLanguageStrings, type CandidateMessages } from "./candidate-builders";
import { candidateDir, registerCandidateStrings } from "./candidate-lang";
import { registerLanguageStrings } from "./language-strings";

export type { CandidateMessages };

type Loader = () => Promise<{ default: CandidateMessages }>;

// Keys match LANGUAGES (lowercased). Explicit imports so each language is
// its own small chunk, downloaded only by candidates who need it.
const LOADERS: Record<string, Loader> = {
  // Built into the page already; listed so an Arabic candidate's cookie
  // banner is in Arabic too.
  ar: () => import("./locales/ar.json"),
  am: () => import("./locales/am.json"),
  om: () => import("./locales/om.json"),
  fil: () => import("./locales/fil.json"),
  zh: () => import("./locales/zh.json"),
  hi: () => import("./locales/hi.json"),
  ur: () => import("./locales/ur.json"),
  bn: () => import("./locales/bn.json"),
  ta: () => import("./locales/ta.json"),
  te: () => import("./locales/te.json"),
  ml: () => import("./locales/ml.json"),
  pa: () => import("./locales/pa.json"),
  si: () => import("./locales/si.json"),
  id: () => import("./locales/id.json"),
  ne: () => import("./locales/ne.json"),
  sw: () => import("./locales/sw.json"),
  vi: () => import("./locales/vi.json"),
  km: () => import("./locales/km.json"),
  my: () => import("./locales/my.json"),
  ti: () => import("./locales/ti.json"),
  so: () => import("./locales/so.json"),
  aa: () => import("./locales/aa.json"),
  ak: () => import("./locales/ak.json"),
  lg: () => import("./locales/lg.json"),
  mg: () => import("./locales/mg.json"),
};

export function hasBundledLanguage(key?: string | null): boolean {
  return Boolean(key && LOADERS[key.toLowerCase()]);
}

/** Loads the candidate's language (if it's a bundled one) and returns the
 * interface language key to use: that language, or the session's EN/AR
 * language when there is no bundle or it fails to load. */
export async function loadCandidateLanguage(key: string | null | undefined, fallback: string): Promise<string> {
  const lower = (key ?? "").toLowerCase();
  const loader = LOADERS[lower];
  if (!loader) return fallback;
  try {
    const messages: CandidateMessages = (await loader()).default;
    registerCandidateStrings(lower, buildCandidateStrings(messages));
    registerLanguageStrings(lower, buildLanguageStrings(messages.language));
    setCookieBannerLanguage({ strings: messages.cookie, dir: candidateDir(lower) });
    return lower;
  } catch {
    return fallback;
  }
}
