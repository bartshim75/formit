import type { Question, QuestionType } from '@/lib/survey-schema';

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `q-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 빌더에서 추가하는 문항의 기본값 */
export function createEmptyQuestion(type: QuestionType): Question {
  const id = newId();
  const base = { id, title: '새 문항', required: false } as const;

  switch (type) {
    case 'single_choice':
    case 'single':
      return {
        ...base,
        type: 'single_choice',
        options: [
          { id: newId(), label: '옵션 1' },
          { id: newId(), label: '옵션 2' },
        ],
      };
    case 'multi_choice':
    case 'multi':
      return {
        ...base,
        type: 'multi_choice',
        options: [
          { id: newId(), label: '옵션 1' },
          { id: newId(), label: '옵션 2' },
        ],
      };
    case 'long_text':
    case 'long':
      return { ...base, type: 'long_text' };
    case 'scale':
    case 'likert':
      return {
        ...base,
        type: 'scale',
        scale: { min: 1, max: 5, minLabel: '매우 아니다', maxLabel: '매우 그렇다' },
      };
    case 'nps':
      return {
        ...base,
        type: 'nps',
        title: '추천 의향 (NPS)',
        scale: { min: 0, max: 10, minLabel: '전혀 추천 안 함', maxLabel: '적극 추천' },
      };
    case 'rating':
      return { ...base, type: 'rating', scale: { min: 1, max: 5 } };
    case 'date':
      return { ...base, type: 'date', title: '날짜를 선택해 주세요' };
    case 'email':
      return { ...base, type: 'email', title: '이메일 주소' };
    case 'section_intro':
      return { ...base, type: 'section_intro', title: '섹션 안내', required: false };
    default:
      return { ...base, type: 'short_text' };
  }
}
