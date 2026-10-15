"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  /** Extra text matched by the search box (e.g. English name, dialling code). */
  keywords?: string;
  /** Shown after the label, muted (e.g. "+971"). */
  hint?: string;
  /** Second line under the label (e.g. a candidate's email). Also searched. */
  description?: string;
  /** Round photo, or initials when there is no photo (e.g. candidates). */
  avatar?: { src?: string | null; initials: string };
  disabled?: boolean;
}

export interface SearchableSelectProps {
  id: string;
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  /** Classes for the closed button (height, border colour, …). */
  buttonClassName?: string;
  /** Options pinned after the list, e.g. "Other". */
  pinnedLast?: SearchableOption[];
  /** Renders the closed button's content (defaults to the option itself). */
  renderValue?: (option: SearchableOption) => React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function normalise(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[ً-ٰٟ]/g, "").replace(/\p{M}/gu, "");
}

export function OptionAvatar({ avatar, size = "md" }: { avatar: NonNullable<SearchableOption["avatar"]>; size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const box = size === "sm" ? "h-7 w-7 text-[11px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs";
  if (avatar.src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar.src} alt="" onError={() => setFailed(true)} className={cn("shrink-0 rounded-full object-cover", box)} />
    );
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700", box)}>
      {avatar.initials || "?"}
    </span>
  );
}

function OptionBody({ option, compact }: { option: SearchableOption; compact?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      {option.avatar && <OptionAvatar avatar={option.avatar} size={compact ? "sm" : "md"} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{option.label}</span>
        {option.description && (
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400" dir="auto">
            {option.description}
          </span>
        )}
      </span>
    </span>
  );
}

// The platform's searchable dropdown: a button that opens a search box over
// the list. Typing filters at once; arrows/Home/End/Enter/Escape work, and
// typing on the closed button opens it with that text. Works the same in
// Arabic and English and on touch screens. Opens upward when there is no
// room below.
export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  invalid,
  disabled,
  className,
  buttonClassName,
  pinnedLast = [],
  renderValue,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<{ up: boolean; maxHeight: number }>({ up: false, maxHeight: 256 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const all = useMemo(() => [...options, ...pinnedLast], [options, pinnedLast]);
  const selected = all.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = normalise(query.trim());
    if (!q) return all;
    return all.filter((o) =>
      normalise(`${o.label} ${o.description ?? ""} ${o.keywords ?? ""} ${o.hint ?? ""} ${o.value}`).includes(q),
    );
  }, [all, query]);

  const close = (focusButton = true) => {
    setOpen(false);
    setQuery("");
    if (focusButton) buttonRef.current?.focus();
  };

  const openList = (initialQuery = "") => {
    if (disabled) return;
    setQuery(initialQuery);
    const selectedIndex = initialQuery ? 0 : Math.max(0, all.findIndex((o) => o.value === value));
    setActive(selectedIndex);
    setOpen(true);
  };

  // Room below vs above decides where the list opens and how tall it is.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const searchHeight = 56;
    const up = below < 240 && above > below;
    setPlacement({ up, maxHeight: Math.max(120, Math.min(288, (up ? above : below) - searchHeight)) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    // Escape closes only the dropdown. Listening on window in the capture
    // phase runs before a surrounding dialog's own Escape handler.
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onEscape, true);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onEscape, true);
      window.clearTimeout(timer);
    };
    // close() only uses refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value);
    close();
  };

  const move = (from: number, step: number) => {
    let i = from;
    for (let n = 0; n < filtered.length; n++) {
      i = Math.min(Math.max(i + step, 0), filtered.length - 1);
      if (!filtered[i]?.disabled) return i;
    }
    return from;
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => move(i, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => move(i, -1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(move(-1, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(move(filtered.length, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (open || disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openList();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Start typing on the closed dropdown: open it with that letter.
      e.preventDefault();
      openList(e.key);
    }
  };

  const activeId = filtered[active] ? `${listId}-opt-${active}` : undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKeyDown}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-start text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60",
          invalid ? "border-destructive" : "border-input",
          open && "border-primary/60 ring-1 ring-primary/30",
          buttonClassName,
        )}
      >
        <span className={cn("flex min-w-0 flex-1 items-center", !selected && "text-muted-foreground")}>
          {selected ? (renderValue ? renderValue(selected) : <OptionBody option={selected} compact />) : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full min-w-[16rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900",
            placement.up ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <div className="relative border-b border-gray-100 p-2 dark:border-gray-800">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              autoComplete="off"
              enterKeyHint="search"
              className="h-10 w-full rounded-md border border-gray-200 bg-white ps-8 pe-2 text-base text-gray-900 outline-none focus:border-primary/60 sm:h-9 sm:text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel ?? placeholder}
            style={{ maxHeight: placement.maxHeight }}
            className="overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-gray-500" role="presentation">
                {emptyText}
              </li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    data-index={index}
                    onMouseEnter={() => !option.disabled && setActive(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(option)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100",
                      option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                      index === active && !option.disabled && "bg-primary/10",
                      isSelected && "font-medium",
                    )}
                  >
                    <OptionBody option={option} />
                    <span className="flex shrink-0 items-center gap-2">
                      {option.hint && <span className="text-xs text-gray-500" dir="ltr">{option.hint}</span>}
                      {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function initialsFor(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
  const letters = `${(firstName || "").trim().charAt(0)}${(lastName || "").trim().charAt(0)}`;
  return (letters || (fallback || "?").trim().charAt(0)).toUpperCase();
}
