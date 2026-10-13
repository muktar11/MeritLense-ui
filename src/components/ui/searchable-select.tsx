"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  /** Extra text matched by the search box (e.g. English name, dialling code). */
  keywords?: string;
  /** Shown after the label, muted (e.g. "+971"). */
  hint?: string;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  invalid?: boolean;
  className?: string;
  /** Options pinned above the sorted list, e.g. "Other". */
  pinnedLast?: SearchableOption[];
  /** Renders the closed button's content (defaults to the label). */
  renderValue?: (option: SearchableOption) => React.ReactNode;
}

function normalise(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[ً-ٰٟ]/g, "").replace(/\p{M}/gu, "");
}

// Combobox: a button that opens a search box over the list. Works the same
// in Arabic and English, with keyboard support.
export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  invalid,
  className,
  pinnedLast = [],
  renderValue,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const all = useMemo(() => [...options, ...pinnedLast], [options, pinnedLast]);
  const selected = all.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = normalise(query.trim());
    if (!q) return all;
    return all.filter((o) => normalise(`${o.label} ${o.keywords ?? ""} ${o.hint ?? ""} ${o.value}`).includes(q));
  }, [all, query]);

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

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (option: SearchableOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        onClick={() => {
          setOpen((o) => !o);
          setActive(0);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-start text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
          invalid ? "border-destructive" : "border-input",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
          {selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[16rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="relative border-b border-gray-100 p-2">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              className="h-9 w-full rounded-md border border-gray-200 ps-8 pe-2 text-base outline-none focus:border-primary/60 sm:text-sm"
            />
          </div>
          <ul id={listId} ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                    index === active ? "bg-primary/10" : "",
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {option.hint && <span className="text-xs text-gray-500" dir="ltr">{option.hint}</span>}
                    {option.value === value && <Check className="h-4 w-4 text-primary" />}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
