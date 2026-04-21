import type { Question, Section, Sections } from '@/lib/survey-schema';

export function countQuestions(sections: Sections): number {
  return sections.reduce((acc, s) => acc + s.questions.length, 0);
}

export function findQuestion(sections: Sections, questionId: string): Question | null {
  for (const section of sections) {
    const q = section.questions.find((qq) => qq.id === questionId);
    if (q) return q;
  }
  return null;
}

export function findSection(sections: Sections, sectionId: string): Section | null {
  return sections.find((s) => s.id === sectionId) ?? null;
}
