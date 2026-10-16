"use client";

// The platform's searchable dropdowns, built on the one SearchableSelect
// component: a generic field with translated defaults, plus the candidate
// and country pickers that appear across B2B and B2C. Every long list
// (candidates, countries, languages, roles, time zones, …) uses these so
// search, keyboard and mobile behaviour are the same everywhere.
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  OptionAvatar,
  SearchableSelect,
  initialsFor,
  type SearchableOption,
  type SearchableSelectProps,
} from "@/components/ui/searchable-select";
import { API_BASE_URL } from "@/lib/config/env";
import { COUNTRIES, countryName } from "@/lib/countries";

export type { SearchableOption };

type FieldProps = Omit<SearchableSelectProps, "placeholder" | "searchPlaceholder" | "emptyText"> & {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
};

export function SearchSelect({ placeholder, searchPlaceholder, emptyText, ...rest }: FieldProps) {
  const t = useTranslations("shared.searchableSelect");
  return (
    <SearchableSelect
      {...rest}
      placeholder={placeholder ?? t("search")}
      searchPlaceholder={searchPlaceholder ?? t("search")}
      emptyText={emptyText ?? t("noResults")}
    />
  );
}

// Photos can come back relative to the API host (local file storage).
export function mediaUrl(url?: string | null) {
  if (!url) return null;
  if (!url.startsWith("/")) return url;
  try {
    return new URL(url, API_BASE_URL).href;
  } catch {
    return url;
  }
}

export interface CandidateLike {
  id: string | number;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_photo?: string | null;
}

export function candidateOption(candidate: CandidateLike): SearchableOption {
  const name = candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || candidate.email || "";
  const [first, ...rest] = name.split(/\s+/);
  return {
    value: String(candidate.id),
    label: name,
    description: candidate.email || undefined,
    avatar: {
      src: mediaUrl(candidate.profile_photo),
      initials: initialsFor(candidate.first_name || first, candidate.last_name || rest[rest.length - 1], candidate.email),
    },
  };
}

// Select Candidate: round photo (or initials), full name and email; search
// matches name or email.
export function CandidateSelect({
  candidates,
  value,
  onChange,
  ...rest
}: Omit<FieldProps, "options" | "value" | "onChange"> & {
  candidates: CandidateLike[];
  value: string | number | null | undefined;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("shared.searchableSelect");
  const options = useMemo(() => candidates.map(candidateOption), [candidates]);
  return (
    <SearchSelect
      {...rest}
      options={options}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={onChange}
      placeholder={rest.placeholder ?? t("selectCandidate")}
      searchPlaceholder={rest.searchPlaceholder ?? t("searchCandidates")}
      renderValue={(option) => (
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {option.avatar && <OptionAvatar avatar={option.avatar} size="lg" />}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-gray-900 dark:text-gray-100">{option.label}</span>
            {option.description && <span className="block truncate text-sm text-gray-500">{option.description}</span>}
          </span>
        </span>
      )}
    />
  );
}

// Country picker over the ISO list. `valueKind` matches what the field
// stores: the 2-letter code (profiles, candidates) or the English name
// (company addresses). A stored value outside the list is kept as an option.
export function CountrySelect({
  value,
  valueKind = "code",
  emptyOptionLabel,
  ...rest
}: Omit<FieldProps, "options"> & {
  valueKind?: "code" | "label";
  /** Adds a first option that clears the field (optional fields). */
  emptyOptionLabel?: string;
}) {
  const t = useTranslations("shared.searchableSelect");
  const locale = useLocale();
  const options = useMemo(() => {
    const list: SearchableOption[] = COUNTRIES.map((c) => ({
      value: valueKind === "code" ? c.key : c.label,
      label: countryName(c.key, locale),
      keywords: `${c.key} ${c.label}`,
    }));
    if (locale !== "en") list.sort((a, b) => a.label.localeCompare(b.label, locale));
    if (value && !list.some((o) => o.value === value)) list.unshift({ value, label: value });
    if (emptyOptionLabel !== undefined) list.unshift({ value: "", label: emptyOptionLabel });
    return list;
  }, [value, valueKind, emptyOptionLabel, locale]);
  return (
    <SearchSelect
      {...rest}
      value={value}
      options={options}
      placeholder={rest.placeholder ?? t("selectCountry")}
      searchPlaceholder={rest.searchPlaceholder ?? t("searchCountries")}
    />
  );
}
