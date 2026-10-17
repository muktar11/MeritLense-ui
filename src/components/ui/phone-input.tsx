"use client";

import { useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { countryName, englishCountryName } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  id: string;
  /** Full international number, e.g. "+971501234567" (what the API stores). */
  value: string;
  onChange: (value: string) => void;
  /** Country to start with when no number is set (e.g. detected location). */
  defaultCountry?: string;
  locale: string;
  invalid?: boolean;
  labels: { country: string; search: string; empty: string; number: string };
}

export function phoneIsValid(value: string): boolean {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

// Country dialling code (searchable by country name in either language or
// by the code itself, e.g. "971") plus the local number.
export function PhoneInput({ id, value, onChange, defaultCountry, locale, invalid, labels }: PhoneInputProps) {
  // Parsed once: while typing, a partial number can't be parsed yet, so the
  // typed digits live in local state rather than being re-derived.
  const [initial] = useState(() => parsePhoneNumberFromString(value || ""));
  const [country, setCountry] = useState<CountryCode | "">((initial?.country as CountryCode) || "");
  const [national, setNational] = useState<string>(initial?.nationalNumber ?? "");
  const activeCountry = country || (defaultCountry as CountryCode) || "";

  const options: SearchableOption[] = useMemo(() => {
    const collator = new Intl.Collator(locale);
    return getCountries()
      .map((code) => {
        const dial = `+${getCountryCallingCode(code)}`;
        return {
          value: code,
          label: countryName(code, locale),
          hint: dial,
          keywords: `${englishCountryName(code)} ${dial} ${dial.slice(1)}`,
        };
      })
      .sort((a, b) => collator.compare(a.label, b.label));
  }, [locale]);

  const compose = (code: CountryCode | "", digits: string) => {
    // Local numbers are often written with a leading 0 (trunk prefix).
    const clean = digits.replace(/[^\d]/g, "").replace(/^0+/, "");
    if (!code) return onChange(clean);
    onChange(clean ? `+${getCountryCallingCode(code)}${clean}` : "");
  };

  return (
    <div className="flex gap-2" dir="ltr">
      <SearchableSelect
        id={`${id}-country`}
        value={activeCountry}
        options={options}
        onChange={(code) => {
          setCountry(code as CountryCode);
          compose(code as CountryCode, national);
        }}
        placeholder={labels.country}
        searchPlaceholder={labels.search}
        emptyText={labels.empty}
        invalid={invalid}
        className="w-32 shrink-0"
        renderValue={(option) => (
          <span className="font-medium" title={option.label}>{option.hint}</span>
        )}
      />
      <input
        id={id}
        name={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => {
          setNational(e.target.value);
          compose(activeCountry, e.target.value);
        }}
        aria-label={labels.number}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-base shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 sm:text-sm",
          invalid ? "border-destructive" : "border-input",
        )}
      />
    </div>
  );
}
