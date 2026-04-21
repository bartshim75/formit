'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import type { Question } from '@/lib/survey-schema';

type Props = {
  question: Question;
  sectionId: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
};

export function QuestionBlock({ question, sectionId, index, selected, onSelect }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    data: { sectionId, type: 'question' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex w-full items-start gap-2 rounded-xl border px-3 py-3 text-left text-sm shadow-sm transition ${
        selected ? 'border-accent ring-accent/30 ring-2' : 'border-border bg-bg hover:bg-bg-soft'
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <span
        className="text-ink-4 mt-0.5 cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="순서 변경"
      >
        <GripVertical className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-ink-4 text-xs font-bold">
          Q{index + 1} · {question.type}
        </div>
        <div className="text-ink mt-0.5 leading-snug font-semibold">
          {question.title || '(제목 없음)'}
        </div>
        {question.required && <div className="text-accent mt-1 text-xs font-semibold">필수</div>}
      </div>
    </button>
  );
}
