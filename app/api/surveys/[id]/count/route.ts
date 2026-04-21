import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data, error } = await sb.rpc('survey_response_count', { p_survey_id: id });

  if (error) return Response.json({ error: 'count_failed' }, { status: 400 });
  return new Response(JSON.stringify({ count: data ?? 0 }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400',
    },
  });
}
