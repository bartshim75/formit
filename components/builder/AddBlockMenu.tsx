'use client';

import { useState } from 'react';

import { createEmptyQuestion } from '@/lib/builder-question';
import type { QuestionType } from '@/lib/survey-schema';

import { useBuilderStore } from './use-builder-store';

const BLOCK_TYPES: { type: QuestionType; label: string }[] = [
  { type: 'short_text', label: '단답' },
  { type: 'long_text', label: '장문' },
  { type: 'single_choice', label: '객관식(단일)' },
  { type: 'multi_choice', label: '객관식(복수)' },
  { type: 'scale', label: '척도' },
  { type: 'nps', label: 'NPS' },
  { type: 'rating', label: '별점' },
  { type: 'date', label: '날짜' },
  { type: 'email', label: '이메일' },
];

type Props = { sectionId: string };

export function AddBlockMenu({ sectionId }: Props) {
  const [open, setOpen] = useState(false);
  const addQuestion = useBuilderStore((s) => s.addQuestion);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-bg-soft/60 text-ink-2 hover:border-accent hover:text-accent-ink w-full rounded-xl border border-dashed py-3 text-sm font-semibold"
      >
        + 문항 추가
      </button>
      {open && (
        <div className="border-border bg-bg-elev absolute top-full right-0 left-0 z-20 mt-2 max-h-64 overflow-auto rounded-xl border p-2 shadow-lg">
          {BLOCK_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className="hover:bg-bg-soft w-full rounded-lg px-3 py-2 text-left text-sm font-semibold"
              onClick={() => {
                addQuestion(sectionId, createEmptyQuestion(type));
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
