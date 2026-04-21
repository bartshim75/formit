import { ImageResponse } from 'next/og';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function fetchLiveSurveyTitle(id: string) {
  const sb = await createClient();
  const { data } = await sb
    .from('surveys')
    .select('title,emoji,description')
    .eq('id', id)
    .eq('status', 'live')
    .maybeSingle();
  return data ?? null;
}

export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await fetchLiveSurveyTitle(id);

  const title = survey?.title ?? '설문';
  const emoji = survey?.emoji ?? '📝';
  const description = survey?.description ?? '지금 이 설문에 참여해 주세요';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'linear-gradient(135deg, #E03E6C 0%, #B02656 100%)',
        padding: 56,
        color: 'white',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Inter", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          borderRadius: 32,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.18)',
          padding: 56,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>{emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Formit</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              textShadow: '0 20px 60px rgba(0,0,0,0.20)',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, opacity: 0.92, lineHeight: 1.35 }}>{description}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, opacity: 0.9 }}>지금 답해주세요</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '14px 18px',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            formit.vercel.app
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
