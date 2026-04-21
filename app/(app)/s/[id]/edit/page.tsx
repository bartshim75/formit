'use client';

import { useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { BuilderPanel } from '@/components/builder/BuilderPanel';
import { useBuilderStore } from '@/components/builder/use-builder-store';
import { useDebouncedSave } from '@/hooks/use-debounced-save';
import { useSurvey } from '@/hooks/use-survey';
import { createClient } from '@/lib/supabase/client';
import { toDbSurvey } from '@/types/survey';

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useSurvey(id);

  const survey = useBuilderStore((s) => s.survey);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const setSurvey = useBuilderStore((s) => s.setSurvey);
  const patchSurvey = useBuilderStore((s) => s.patchSurvey);
  const markSaved = useBuilderStore((s) => s.markSaved);

  useEffect(() => {
    if (data) setSurvey(data);
  }, [data, setSurvey]);

  const save = useCallback(
    async (s: typeof survey) => {
      if (!s || !isDirty) return;
      const sb = createClient();
      const payload = toDbSurvey(s);
      const { id: _id, owner_id: _ownerId, ...update } = payload;
      const { error: upsertError } = await sb.from('surveys').update(update).eq('id', s.id);
      if (!upsertError) markSaved();
    },
    [isDirty, markSaved],
  );

  useDebouncedSave(survey, 1500, save);

  if (isLoading) {
    return (
      <div className="border-border bg-bg-elev text-ink-2 rounded-2xl border p-8 text-sm shadow-sm">
        불러오는 중…
      </div>
    );
  }
  if (error || !survey) {
    return (
      <div className="border-border bg-bg-elev text-ink-2 rounded-2xl border p-8 text-sm shadow-sm">
        설문을 불러올 수 없어요.
      </div>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="border-border bg-bg-elev rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-extrabold tracking-tight">기본 정보</h1>
          <div className="text-ink-3 text-xs font-semibold">
            {isDirty ? '저장 대기…' : '저장됨'}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <div className="text-ink-3 text-xs font-semibold">제목</div>
            <input
              className="border-border bg-bg ring-accent rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              value={survey.title}
              onChange={(e) => patchSurvey({ title: e.target.value })}
              placeholder="설문 제목"
            />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <div className="text-ink-3 text-xs font-semibold">설명</div>
            <textarea
              className="border-border bg-bg ring-accent rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              value={survey.description ?? ''}
              onChange={(e) => patchSurvey({ description: e.target.value })}
              placeholder="설문 설명"
              rows={3}
            />
          </label>
          <label className="grid gap-2">
            <div className="text-ink-3 text-xs font-semibold">이모지</div>
            <input
              className="border-border bg-bg ring-accent w-full max-w-[8rem] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              value={survey.emoji}
              onChange={(e) => patchSurvey({ emoji: e.target.value })}
            />
          </label>
        </div>
      </section>

      <BuilderPanel />
    </main>
  );
}
