/** 클라이언트에서도 읽을 수 있는 기능 플래그 (NEXT_PUBLIC_) */

export function featureAiSummary(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY === '1';
}

export function featurePublicApi(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_PUBLIC_API === '1';
}
