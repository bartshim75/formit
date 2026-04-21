type CaptureProperties = Record<string, unknown>;

const OPT_OUT_KEY = 'formit_analytics_opt_out';

export function isAnalyticsOptedOut(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(OPT_OUT_KEY) === '1';
}

export function setAnalyticsOptOut(optOut: boolean) {
  if (typeof window === 'undefined') return;
  if (optOut) window.localStorage.setItem(OPT_OUT_KEY, '1');
  else window.localStorage.removeItem(OPT_OUT_KEY);
}

type PosthogLike = { capture?: (event: string, properties?: CaptureProperties) => void };

function getPosthog(): PosthogLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { posthog?: PosthogLike }).posthog;
}

export function captureEvent(event: string, properties?: CaptureProperties) {
  if (typeof window === 'undefined') return;
  if (isAnalyticsOptedOut()) return;
  getPosthog()?.capture?.(event, properties);
}
