"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Get the label for the selected value
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabel}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border rounded-md shadow-lg p-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-secondary/20 transition-colors ${
                value === option.value ? "bg-secondary/10 font-medium" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}