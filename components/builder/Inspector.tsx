'use client';

import { useMemo } from 'react';

import type { Question } from '@/lib/survey-schema';

import { useBuilderStore } from './use-builder-store';

export function Inspector() {
  const survey = useBuilderStore((s) => s.survey);
  const selection = useBuilderStore((s) => s.selection);
  const updateQuestion = useBuilderStore((s) => s.updateQuestion);

  const ctx = useMemo(() => {
    if (!survey || !selection) return null;
    const sec = survey.sections.find((s) => s.id === selection.sectionId);
    const q = sec?.questions.find((x) => x.id === selection.questionId);
    if (!sec || !q) return null;
    return { sectionId: sec.id, question: q };
  }, [survey, selection]);

  if (!ctx) {
    return (
      <div className="border-border bg-bg-elev text-ink-2 rounded-2xl border p-6 text-sm shadow-sm">
        왼쪽 목록에서 문항을 선택하면 제목·필수 여부·옵션을 편집할 수 있어요.
      </div>
    );
  }

  const { sectionId, question } = ctx;
  const patch = (p: Partial<Question>) => updateQuestion(sectionId, question.id, p);

  const choiceTypes = ['single_choice', 'multi_choice', 'single', 'multi'] as const;
  const isChoice = choiceTypes.includes(question.type as (typeof choiceTypes)[number]);

  return (
    <div className="border-border bg-bg-elev rounded-2xl border p-6 shadow-sm">
      <h2 className="text-lg font-extrabold tracking-tight">문항 속성</h2>
      <p className="text-ink-3 mt-1 text-xs">타입: {question.type}</p>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-ink-3 text-xs font-semibold">제목</span>
          <input
            className="border-border bg-bg ring-accent rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            value={question.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => patch({ required: e.target.checked })}
          />
          필수 응답
        </label>
        <label className="grid gap-2">
          <span className="text-ink-3 text-xs font-semibold">설명 (선택)</span>
          <textarea
            className="border-border bg-bg ring-accent min-h-[72px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            value={question.description ?? ''}
            onChange={(e) => patch({ description: e.target.value ? e.target.value : undefined })}
            placeholder="응답자에게 보조 설명을 보여줄 수 있어요"
          />
        </label>

        {isChoice && question.options && (
          <div className="grid gap-2">
            <span className="text-ink-3 text-xs font-semibold">선택지</span>
            <div className="grid gap-2">
              {question.options.map((opt, i) => (
                <input
                  key={opt.id}
                  className="border-border bg-bg ring-accent rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  value={opt.label}
                  onChange={(e) => {
                    const next = question.options!.map((o, j) =>
                      j === i ? { ...o, label: e.target.value } : o,
                    );
                    patch({ options: next });
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="border-border bg-bg-soft hover:bg-bg rounded-lg border px-3 py-2 text-xs font-semibold"
              onClick={() => {
                const id = crypto.randomUUID();
                patch({ options: [...(question.options ?? []), { id, label: '새 옵션' }] });
              }}
            >
              옵션 추가
            </button>
          </div>
        )}

        {question.scale && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-ink-3 grid gap-1 text-xs font-semibold">
              최소
              <input
                type="number"
                className="border-border bg-bg rounded-lg border px-2 py-2 text-sm"
                value={question.scale.min}
                onChange={(e) =>
                  patch({ scale: { ...question.scale!, min: Number(e.target.value) || 0 } })
                }
              />
            </label>
            <label className="text-ink-3 grid gap-1 text-xs font-semibold">
              최대
              <input
                type="number"
                className="border-border bg-bg rounded-lg border px-2 py-2 text-sm"
                value={question.scale.max}
                onChange={(e) =>
                  patch({ scale: { ...question.scale!, max: Number(e.target.value) || 0 } })
                }
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
