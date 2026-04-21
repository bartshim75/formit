'use client';

import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';

/** 예시·플레이스홀더 키는 초기화하지 않아 404/401 네트워크 오류를 막음 */
function isUsablePostHogKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  if (/xxx|placeholder|changeme|your[_-]?key/i.test(k)) return false;
  if (k.startsWith('phc_') && k.length < 32) return false;
  return true;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inited = useRef(false);
  const analyticsReady = useRef(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || !isUsablePostHogKey(key) || inited.current) return;
    inited.current = true;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    });
    analyticsReady.current = true;
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || !isUsablePostHogKey(key) || !analyticsReady.current) return;
    const qs = searchParams?.toString();
    const href =
      typeof window !== 'undefined' ? window.location.href : qs ? `${pathname}?${qs}` : pathname;
    posthog.capture('$pageview', { $current_url: href });
  }, [pathname, searchParams]);

  return children;
}
