import { NextResponse } from 'next/server';

import { featurePublicApi } from '@/lib/flags';

/** Phase 4: 공개 REST API 스텁 — 플래그 켜기 전까지 비활성 */
export async function GET(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  if (!featurePublicApi()) {
    return NextResponse.json({ error: 'public_api_disabled' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, message: '스펙 확정 후 구현 예정' });
}
