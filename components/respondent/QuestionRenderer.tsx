'use client';

import type { Question } from '@/lib/survey-schema';

type Props = {
  q: Question;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function QuestionRenderer({ q, value, onChange }: Props) {
  switch (q.type) {
    case 'short':
    case 'short_text':
      return (
        <input
          className="border-border bg-bg-elev ring-accent w-full rounded-lg border px-4 py-3 text-base shadow-sm outline-none focus:ring-2"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="답변을 입력하세요"
        />
      );

    case 'long':
    case 'long_text':
      return (
        <textarea
          className="border-border bg-bg-elev ring-accent w-full rounded-lg border px-4 py-3 text-base shadow-sm outline-none focus:ring-2"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="자유롭게 적어주세요"
          rows={5}
        />
      );

    case 'single':
    case 'single_choice': {
      const options = (q.options ?? []).map((o) => ('label' in o ? o.label : String(o)));
      // legacy는 options가 string[]일 수 있어 방어
      const normalized = (q.options as unknown[] | undefined) ?? options;
      const list = normalized.map((opt) =>
        typeof opt === 'string' ? opt : (opt as { label: string }).label,
      );
      const selected = typeof value === 'string' ? value : '';

      return (
        <div className="flex flex-col gap-2">
          {list.map((opt) => {
            const isSel = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                className={[
                  'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  isSel
                    ? 'border-accent bg-accent-softer text-accent-ink font-semibold'
                    : 'border-border bg-bg-elev text-ink-2 hover:bg-bg-soft',
                ].join(' ')}
                onClick={() => onChange(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    case 'multi':
    case 'multi_choice': {
      const selected = Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
      const normalized = (q.options as unknown[] | undefined) ?? [];
      const list = normalized.map((opt) =>
        typeof opt === 'string' ? opt : (opt as { label: string }).label,
      );

      return (
        <div className="flex flex-col gap-2">
          {list.map((opt) => {
            const isSel = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className={[
                  'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  isSel
                    ? 'border-accent bg-accent-softer text-accent-ink font-semibold'
                    : 'border-border bg-bg-elev text-ink-2 hover:bg-bg-soft',
                ].join(' ')}
                onClick={() => {
                  if (isSel) onChange(selected.filter((v) => v !== opt));
                  else onChange([...selected, opt]);
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    case 'rating': {
      const n = typeof value === 'number' ? value : 0;
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              className={[
                'h-10 w-10 rounded-full border text-sm font-bold transition-colors',
                n >= v
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-bg-elev text-ink-2 hover:bg-bg-soft',
              ].join(' ')}
              onClick={() => onChange(v)}
              aria-label={`${v}점`}
            >
              {v}
            </button>
          ))}
        </div>
      );
    }

    case 'nps': {
      const n = typeof value === 'number' ? value : -1;
      return (
        <div>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }).map((_, i) => {
              const isSel = n === i;
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'h-10 rounded-lg border text-sm font-bold transition-colors',
                    isSel
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-bg-elev text-ink-2 hover:bg-bg-soft',
                  ].join(' ')}
                  onClick={() => onChange(i)}
                >
                  {i}
                </button>
              );
            })}
          </div>
          <div className="text-ink-3 mt-2 flex justify-between text-xs">
            <span>전혀 아니다</span>
            <span>매우 그렇다</span>
          </div>
        </div>
      );
    }

    case 'date':
      return (
        <input
          type="date"
          className="border-border bg-bg-elev ring-accent w-full rounded-lg border px-4 py-3 text-base shadow-sm outline-none focus:ring-2"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <div className="border-border bg-bg-soft text-ink-2 rounded-lg border px-4 py-3 text-sm">
          아직 지원하지 않는 문항 타입이에요: <span className="font-mono">{q.type}</span>
        </div>
      );
  }
}
