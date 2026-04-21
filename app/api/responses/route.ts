import crypto from 'node:crypto';

import { captureServerEvent } from '@/lib/analytics-server';
import { createClient } from '@/lib/supabase/server';
import { ResponseSubmitSchema } from '@/lib/survey-schema';
import { ratelimitPerDay, ratelimitPerMinute } from '@/lib/rate-limit';

function getClientIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for');
  if (!fwd) return 'local';
  return fwd.split(',')[0]?.trim() || 'local';
}

function hmacSha256Hex(value: string, key: string) {
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (ratelimitPerMinute) {
    const { success } = await ratelimitPerMinute.limit(`submit:m:${ip}`);
    if (!success) return new Response('Too many requests', { status: 429 });
  }
  if (ratelimitPerDay) {
    const { success } = await ratelimitPerDay.limit(`submit:d:${ip}`);
    if (!success) return new Response('Too many requests', { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ResponseSubmitSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });

  const salt = process.env.IP_HASH_SALT;
  const ipHash = salt ? hmacSha256Hex(ip, salt) : null;

  const sb = await createClient();
  const { data, error } = await sb
    .from('responses')
    .insert({
      survey_id: parsed.data.surveyId,
      answers: parsed.data.answers,
      meta: {
        ip_hash: ipHash,
        ua: req.headers.get('user-agent'),
        tz: parsed.data.tz ?? null,
        referrer: req.headers.get('referer') ?? req.headers.get('referrer') ?? null,
      },
    })
    .select('id')
    .single();

  if (error) return Response.json({ error: 'submit_failed' }, { status: 400 });

  void captureServerEvent('respondent_submitted', `anon:${parsed.data.surveyId}`, {
    survey_id: parsed.data.surveyId,
    response_id: data.id,
  });

  return Response.json({ id: data.id });
}
