import 'server-only';

type CaptureProperties = Record<string, unknown>;

/** Route Handler / 서버에서 PostHog capture */
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties?: CaptureProperties,
): Promise<void> {
  const apiKey = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = (
    process.env.POSTHOG_HOST ??
    process.env.NEXT_PUBLIC_POSTHOG_HOST ??
    'https://app.posthog.com'
  ).replace(/\/$/, '');
  if (!apiKey) return;
  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: properties ?? {},
      }),
    });
  } catch {
    // 서버 캡처 실패는 응답 흐름을 막지 않음
  }
}
