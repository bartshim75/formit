'use client';

import Link from 'next/link';
import { useQueryState, parseAsString } from 'nuqs';
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { captureEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client';
import { useSurveys } from '@/hooks/use-surveys';
import type { Survey } from '@/types/survey';

type Props = {
  initialSurveys: Survey[];
};

export function DashboardClient({ initialSurveys }: Props) {
  const qc = useQueryClient();
  const { data } = useSurveys();
  const surveys = useMemo(() => data ?? initialSurveys, [data, initialSurveys]);

  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));

  const filtered = useMemo(() => {
    const needle = (q ?? '').trim().toLowerCase();
    if (!needle) return surveys;
    return surveys.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(needle) ||
        (s.description ?? '').toLowerCase().includes(needle),
    );
  }, [surveys, q]);

  const duplicate = useMutation({
    mutationFn: async (s: Survey) => {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error('로그인이 필요해요');
      const { data: row, error } = await sb
        .from('surveys')
        .insert({
          owner_id: user.id,
          workspace_id: s.workspaceId ?? null,
          title: `${s.title || '설문'} (복사)`,
          description: s.description ?? null,
          emoji: s.emoji,
          color: s.color ?? null,
          status: 'draft',
          sections: s.sections,
          settings: s.settings,
          notify_email: s.notifyEmail ?? null,
          notify_threshold: s.notifyThreshold ?? null,
          webhook_url: s.webhookUrl ?? null,
          variants: s.variants ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return row.id as string;
    },
    onSuccess: (newId) => {
      void qc.invalidateQueries({ queryKey: ['surveys'] });
      captureEvent('survey_duplicated', { survey_id: newId });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const sb = createClient();
      const { error } = await sb.from('surveys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['surveys'] });
      captureEvent('survey_deleted', { survey_id: id });
    },
  });

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">대시보드</h1>
          <p className="text-ink-2 mt-1 text-sm">
            내 설문을 관리하고 공유 링크로 응답을 수집하세요.
          </p>
        </div>
        <a
          className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-5 py-2.5 text-sm font-semibold text-white"
          href="/s/new"
        >
          새 설문 만들기
        </a>
      </div>

      <div className="mt-6">
        <label className="grid max-w-md gap-2">
          <span className="text-ink-3 text-xs font-semibold">검색 (URL에 반영)</span>
          <input
            className="border-border bg-bg-elev ring-accent rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
            placeholder="제목·설명으로 필터…"
            value={q}
            onChange={(e) => void setQ(e.target.value || null)}
          />
        </label>
      </div>

      <div className="mt-8 grid gap-4">
        {filtered.length === 0 ? (
          <div className="border-border bg-bg-elev text-ink-2 rounded-2xl border p-8 text-sm shadow-sm">
            {surveys.length === 0
              ? '아직 설문이 없어요. 위 버튼으로 첫 설문을 만들어보세요.'
              : '검색 결과가 없어요. 다른 키워드를 입력해 보세요.'}
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="group border-border bg-bg-elev rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <Link href={`/s/${s.id}/edit`} className="min-w-0 flex-1">
                  <div className="text-lg font-extrabold tracking-tight">
                    {s.emoji} {s.title || '제목 없는 설문'}
                  </div>
                  {s.description && <div className="text-ink-2 mt-1 text-sm">{s.description}</div>}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="border-border bg-bg-soft text-ink-2 rounded-full border px-3 py-1">
                      {s.status}
                    </span>
                    <Link
                      className="border-border bg-bg text-ink-2 hover:border-accent hover:text-accent-ink rounded-full border px-3 py-1"
                      href={`/s/${s.id}/share`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      공유
                    </Link>
                    <Link
                      className="border-border bg-bg text-ink-2 hover:border-accent hover:text-accent-ink rounded-full border px-3 py-1"
                      href={`/s/${s.id}/results`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      결과
                    </Link>
                  </div>
                </Link>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="border-border bg-bg hover:bg-bg-soft rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={duplicate.isPending}
                    onClick={() => duplicate.mutate(s)}
                  >
                    복제
                  </button>
                  <button
                    type="button"
                    className="border-bad/40 bg-bg text-bad hover:bg-bad/10 rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (confirm('이 설문을 삭제할까요? 되돌릴 수 없어요.')) remove.mutate(s.id);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
