'use client';

import Link from 'next/link';
import { useQueryState, parseAsString } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';

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

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const stats = useMemo(() => {
    const total = surveys.length;
    const live = surveys.filter((s) => s.status === 'live').length;
    const draft = surveys.filter((s) => s.status === 'draft').length;
    const updatedMost = surveys
      .map((s) => (s.updatedAt ? new Date(s.updatedAt).getTime() : 0))
      .reduce((a, b) => Math.max(a, b), 0);
    const minutesAgo = updatedMost ? Math.max(0, Math.round((now - updatedMost) / 60000)) : 0;
    return { total, live, draft, minutesAgo };
  }, [surveys, now]);

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
    <main className="grid gap-6">
      <section className="border-border bg-bg-elev rounded-[24px] border p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-ink-3 text-xs font-extrabold">안녕하세요</div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
              지금 설문을 만들고 있어요
            </h1>
          </div>
          <div className="border-border bg-bg-soft text-ink-2 hidden rounded-full border px-4 py-2 text-xs font-extrabold shadow-sm md:inline-flex">
            다크 모드 — 플랜에서만 활성화할게요
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ['전체 설문', `${stats.total.toLocaleString()}`],
            ['진행 중 설문', `${stats.live.toLocaleString()}`],
            ['초안', `${stats.draft.toLocaleString()}`],
            ['최근 수정', stats.total === 0 ? '—' : `${stats.minutesAgo}분 전`],
          ].map(([k, v]) => (
            <div key={k} className="border-border bg-bg rounded-2xl border px-4 py-4">
              <div className="text-ink-3 text-xs font-extrabold">{k}</div>
              <div className="mt-2 text-xl font-extrabold tracking-tight">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {['전체', '공개 중', '초안', '마감'].map((t, idx) => (
              <button
                key={t}
                type="button"
                className={[
                  'rounded-full border px-4 py-2 text-xs font-extrabold transition',
                  idx === 0
                    ? 'border-ink bg-ink text-white'
                    : 'border-border bg-bg text-ink-2 hover:bg-bg-soft',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="border-border bg-bg-elev ring-accent h-10 w-[260px] rounded-full border px-4 text-sm font-semibold outline-none focus:ring-2"
              placeholder="설문 검색…"
              value={q}
              onChange={(e) => void setQ(e.target.value || null)}
            />
            <Link
              href="/s/new"
              className="border-accent bg-accent shadow-pop hover:bg-accent-ink inline-flex h-10 items-center rounded-full border px-5 text-sm font-extrabold text-white"
            >
              + 새 설문
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="border-border bg-bg-elev text-ink-2 rounded-[24px] border p-8 text-sm shadow-sm md:col-span-3">
            {surveys.length === 0
              ? '아직 설문이 없어요. 오른쪽 위 버튼으로 첫 설문을 만들어보세요.'
              : '검색 결과가 없어요. 다른 키워드를 입력해 보세요.'}
          </div>
        ) : (
          filtered.map((s, idx) => (
            <div
              key={s.id}
              className="group border-border bg-bg-elev overflow-hidden rounded-[24px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={[
                  'h-20 px-5 py-4',
                  idx % 3 === 0
                    ? 'bg-[linear-gradient(135deg,rgba(224,62,108,0.16),rgba(224,62,108,0.04))]'
                    : idx % 3 === 1
                      ? 'bg-[linear-gradient(135deg,rgba(31,157,102,0.12),rgba(31,157,102,0.04))]'
                      : 'bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04))]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="border-border text-ink-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-extrabold">
                    {s.status === 'live' ? '공개 중' : s.status === 'draft' ? '초안' : '마감'}
                  </div>
                  <button
                    type="button"
                    className="border-border text-ink-2 grid h-9 w-9 place-items-center rounded-full border bg-white/70 opacity-80 transition hover:opacity-100"
                    aria-label="더보기"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <Link href={`/s/${s.id}/edit`} className="block">
                  <div className="text-sm font-extrabold tracking-tight">
                    {s.emoji} {s.title || '제목 없는 설문'}
                  </div>
                  <div className="text-ink-2 mt-2 line-clamp-2 text-xs leading-5">
                    {s.description || '설명은 비워둘 수 있어요. 응답자 화면에서는 더 짧게 보여요.'}
                  </div>
                </Link>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-extrabold">
                  <Link
                    className="border-border bg-bg text-ink-2 hover:border-accent hover:text-accent-ink rounded-full border px-3 py-1 transition"
                    href={`/s/${s.id}/share`}
                  >
                    공유
                  </Link>
                  <Link
                    className="border-border bg-bg text-ink-2 hover:border-accent hover:text-accent-ink rounded-full border px-3 py-1 transition"
                    href={`/s/${s.id}/results`}
                  >
                    결과
                  </Link>
                  <button
                    type="button"
                    className="border-border bg-bg text-ink-2 hover:bg-bg-soft ml-auto rounded-full border px-3 py-1 transition disabled:opacity-50"
                    disabled={duplicate.isPending}
                    onClick={() => duplicate.mutate(s)}
                  >
                    복제
                  </button>
                  <button
                    type="button"
                    className="border-bad/40 bg-bg text-bad hover:bg-bad/10 rounded-full border px-3 py-1 transition disabled:opacity-50"
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
      </section>
    </main>
  );
}
