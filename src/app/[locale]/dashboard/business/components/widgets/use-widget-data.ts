"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Each dashboard widget loads its own data, so hidden widgets never cost a
// request and one failing endpoint can't blank the whole dashboard.
export function useWidgetData<T>(fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetcherRef.current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.error("Failed to load dashboard widget:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setAttempt((value) => value + 1);
  }, []);

  return { data, loading, error, retry };
}
