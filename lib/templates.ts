export type Template = {
  id: string;
  title: string;
  description: string;
  emoji: string;
};

export const TEMPLATES: Template[] = [
  {
    id: 'product-feedback',
    title: '제품 피드백',
    description: '빠르게 핵심 인사이트를 모으는 설문',
    emoji: '📝',
  },
  {
    id: 'event-retro',
    title: '행사 회고',
    description: '참여자 만족도와 개선점을 정리',
    emoji: '🎤',
  },
  { id: 'nps', title: 'NPS 설문', description: '추천 의향을 측정하는 가장 빠른 방법', emoji: '📈' },
];
