'use client';

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface LanguageSelectorProps {
  locales?: Record<string, string>; // make it optional
}

export function LanguageSelector({ locales }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'en';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLanguage = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
    setOpen(false);
  };

  // default locales if none passed
  const availableLocales = locales || { en: 'EN', ar: 'AR' };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1"
      >
        {availableLocales[currentLocale] || currentLocale.toUpperCase()}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-24 bg-white border rounded-md shadow-lg p-1 z-50">
          {Object.entries(availableLocales).map(([code, name]) => (
            <button
              key={code}
              onClick={() => switchLanguage(code)}
              className="w-full px-3 py-2 text-sm hover:bg-secondary/20 text-left rounded"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
