'use client';

import { useEffect, useRef } from 'react';

export function useDebouncedSave<T>(value: T, delayMs: number, onSave: (value: T) => void) {
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    const t = window.setTimeout(() => onSave(latest.current), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, onSave, value]);
}
