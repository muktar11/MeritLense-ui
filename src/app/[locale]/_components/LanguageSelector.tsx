"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function LanguageSelector() {
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

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1"
      >
        {currentLocale.toUpperCase()}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-24 bg-white border rounded-md shadow-lg p-1 z-50">
          <button
            onClick={() => switchLanguage('en')}
            className="w-full px-3 py-2 text-sm hover:bg-secondary/20 text-left rounded"
          >
            EN
          </button>
          <button
            onClick={() => switchLanguage('ar')}
            className="w-full px-3 py-2 text-sm hover:bg-secondary/20 text-left rounded"
          >
            AR
          </button>
        </div>
      )}
    </div>
  );
}