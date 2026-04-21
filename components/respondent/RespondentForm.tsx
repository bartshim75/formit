'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Question, Section } from '@/lib/survey-schema';
import type { Survey } from '@/types/survey';

import { QuestionRenderer } from './QuestionRenderer';

type Props = {
  survey: Survey;
  onSubmit: (answers: Record<string, unknown>) => Promise<void>;
  publicMode?: boolean;
};

type Errors = Record<string, string>;

function isAnswered(value: unknown) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function RespondentForm({ survey, onSubmit, publicMode = true }: Props) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(() => survey.sections ?? [], [survey.sections]);
  const totalSections = sections.length;
  const currentSection: Section | undefined = sections[sectionIdx];

  const totalQuestions = useMemo(
    () => sections.reduce((sum, sec) => sum + sec.questions.length, 0),
    [sections],
  );
  const answeredCount = useMemo(() => Object.values(answers).filter(isAnswered).length, [answers]);
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const setAnswer = useCallback((qId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setErrors((prev) => {
      if (!(qId in prev)) return prev;
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  }, []);

  const validateSection = useCallback(() => {
    if (!currentSection) return true;
    const nextErrors: Errors = {};
    for (const q of currentSection.questions) {
      if (q.required) {
        const v = answers[q.id];
        if (!isAnswered(v)) nextErrors[q.id] = '필수 응답 문항이에요';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [answers, currentSection]);

  const goPrev = useCallback(() => {
    setSectionIdx((idx) => Math.max(0, idx - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(async () => {
    if (!validateSection()) return;

    if (sectionIdx >= totalSections - 1) {
      if (submitting) return;
      setSubmitting(true);
      try {
        await onSubmit(answers);
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSectionIdx((idx) => Math.min(totalSections - 1, idx + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [answers, onSubmit, sectionIdx, submitting, totalSections, validateSection]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if ((e.target as HTMLElement | null)?.tagName?.toLowerCase() === 'textarea') return;
      e.preventDefault();
      void goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext]);

  if (!currentSection) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <div className="border-border bg-bg-elev rounded-xl border p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">설문 구성이 비어있어요</h1>
          <p className="text-ink-2 mt-2 text-sm">섹션/문항이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-bg text-ink flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-[520px] text-center">
          <div className="text-[72px]">🎉</div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">응답해주셔서 감사합니다</h1>
          <p className="text-ink-2 mt-3 text-sm leading-6">
            소중한 의견이 <span className="font-semibold">{survey.title || '설문'}</span>의 다음
            이야기를 만드는 데 큰 도움이 됩니다.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold shadow-sm"
              onClick={() => {
                setSectionIdx(0);
                setAnswers({});
                setErrors({});
                setSubmitted(false);
              }}
            >
              한 번 더 응답
            </button>
            {publicMode && (
              <a
                className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-4 py-2 text-sm font-semibold text-white"
                href="/"
              >
                Formit 시작하기
              </a>
            )}
          </div>
          {publicMode && (
            <div className="text-ink-4 mt-8 text-xs">
              Powered by <span className="text-accent-ink font-bold">Formit</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg text-ink min-h-screen">
      <div className="border-border bg-bg/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center gap-3 px-6 py-4">
          <div className="text-sm font-semibold">{survey.title || '설문'}</div>
          <div className="border-border bg-bg-elev text-ink-2 ml-auto rounded-full border px-3 py-1 text-xs font-semibold shadow-sm">
            미리 보기 모드
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 pt-6">
        <div className="text-ink-3 flex items-center justify-between text-xs font-semibold">
          <span>
            섹션 {sectionIdx + 1} / {totalSections} · {currentSection.title}
          </span>
          <span>{Math.round(progress)}% 완료</span>
        </div>
        <div className="bg-bg-soft mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 pt-8 pb-28">
        <div className="border-border bg-bg-elev rounded-xl border p-6 shadow-sm">
          <div className="border-border bg-bg-soft text-ink-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <span>{survey.emoji || '📝'}</span>
            <span>섹션 {sectionIdx + 1}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{currentSection.title}</h1>
          {currentSection.description && (
            <p className="text-ink-2 mt-2 text-sm leading-6">{currentSection.description}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-7">
          {currentSection.questions.map((q: Question, qIdx: number) => (
            <div key={q.id} className="border-border bg-bg-elev rounded-xl border p-6 shadow-sm">
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-ink-4 text-xs font-bold">Q{qIdx + 1}</span>
                  <h3 className="text-lg leading-snug font-bold tracking-tight">
                    {q.title || '(제목 없음)'}
                    {q.required && <span className="text-accent ml-1">*</span>}
                  </h3>
                </div>
                {q.description && <div className="text-ink-2 mt-1 text-sm">{q.description}</div>}
              </div>

              <QuestionRenderer q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />

              {errors[q.id] && (
                <div className="text-bad mt-3 text-xs font-semibold">⚠ {errors[q.id]}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-border bg-bg/90 fixed right-0 bottom-0 left-0 border-t backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-40"
            onClick={goPrev}
            disabled={sectionIdx === 0}
          >
            이전
          </button>
          <div className="text-ink-3 text-xs">Enter로 다음</div>
          <button
            type="button"
            className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void goNext()}
            disabled={submitting}
          >
            {submitting ? '제출 중…' : sectionIdx === totalSections - 1 ? '제출하기 🎉' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}
