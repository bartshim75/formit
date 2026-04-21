import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const template = url.searchParams.get('template');

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect('/');

  let workspaceId: string | null = null;
  const wsRes = await sb.from('workspaces').select('id').eq('owner_id', user.id).maybeSingle();
  if (!wsRes.error && wsRes.data?.id) workspaceId = wsRes.data.id;

  const { data, error } = await sb
    .from('surveys')
    .insert({
      owner_id: user.id,
      workspace_id: workspaceId,
      title: template ? `새 설문 (${template})` : '새 설문',
      description: null,
      emoji: '📝',
      color: null,
      status: 'draft',
      sections: [
        {
          id: 'sec-1',
          title: '첫 번째 섹션',
          description: '문항을 추가해보세요',
          questions: [],
        },
      ],
      settings: {},
    })
    .select('id')
    .single();

  if (error || !data) redirect('/dashboard');
  redirect(`/s/${data.id}/edit`);
}
