"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// City lists are static files, one per country (public/geo/cities/XX.json:
// [{ "en": "Dubai", "ar": "دبي" }, ...], largest first), loaded only when a
// country is chosen. The value stored is the English name, so records stay
// consistent whatever language the form was filled in. A city that isn't
// listed can still be typed.
type City = { en: string; ar?: string };
const cityCache = new Map<string, Promise<City[]>>();

function loadCities(code: string): Promise<City[]> {
  if (!cityCache.has(code)) {
    cityCache.set(
      code,
      fetch(`/geo/cities/${code}.json`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    );
  }
  return cityCache.get(code)!;
}

function normalise(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[ً-ٰٟ]/g, "").replace(/\p{M}/gu, "");
}

interface CityInputProps {
  id: string;
  countryCode: string;
  value: string;
  onChange: (value: string) => void;
  locale: string;
  invalid?: boolean;
  labels: { select: string; search: string; type: string; empty: string };
}

export function CityInput({ id, countryCode, value, onChange, locale, invalid, labels }: CityInputProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    let cancelled = false;
    if (!countryCode) {
      queueMicrotask(() => !cancelled && setCities([]));
      return;
    }
    loadCities(countryCode).then((list) => !cancelled && setCities(list));
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  const label = (city: City) => (locale === "ar" && city.ar ? city.ar : city.en);
  const matches = useMemo(() => {
    const q = normalise(query.trim());
    const list = q ? cities.filter((c) => normalise(`${c.en} ${c.ar ?? ""}`).includes(q)) : cities;
    return list.slice(0, 200);
  }, [cities, query]);
  const selected = cities.find((c) => c.en === value);
  const inputClass = cn(
    "h-11 w-full rounded-md border bg-transparent px-3 text-base shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 sm:text-sm",
    invalid ? "border-destructive" : "border-input",
  );

  // No list for this country (or none chosen yet): a plain text field.
  if (!cities.length) {
    return (
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={labels.type}
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
    );
  }

  const typed = query.trim();
  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(inputClass, "flex items-center justify-between gap-2 text-start")}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? (selected ? label(selected) : value) : labels.select}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[16rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="relative border-b border-gray-100 p-2">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (matches[0]) onChange(matches[0].en);
                  else if (typed) onChange(typed);
                  setOpen(false);
                  setQuery("");
                } else if (e.key === "Escape") setOpen(false);
              }}
              placeholder={labels.search}
              aria-label={labels.search}
              className="h-9 w-full rounded-md border border-gray-200 ps-8 pe-2 text-base outline-none focus:border-primary/60 sm:text-sm"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {matches.map((city) => (
              <li
                key={city.en}
                role="option"
                aria-selected={city.en === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(city.en);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-primary/10"
              >
                <span className="truncate">{label(city)}</span>
                {city.en === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </li>
            ))}
            {typed && !matches.some((c) => normalise(c.en) === normalise(typed) || normalise(c.ar ?? "") === normalise(typed)) && (
              <li
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(typed);
                  setOpen(false);
                  setQuery("");
                }}
                className="cursor-pointer border-t border-gray-100 px-3 py-2 text-sm text-primary hover:bg-primary/10"
              >
                {labels.type}: “{typed}”
              </li>
            )}
            {!matches.length && !typed && <li className="px-3 py-2 text-sm text-gray-500">{labels.empty}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
