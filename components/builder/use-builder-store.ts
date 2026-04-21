'use client';

import { create } from 'zustand';

import type { Question, Section } from '@/lib/survey-schema';
import type { Survey } from '@/types/survey';

export type BuilderSelection = { sectionId: string; questionId: string } | null;

type BuilderState = {
  survey: Survey | null;
  isDirty: boolean;
  selection: BuilderSelection;
  setSurvey: (survey: Survey) => void;
  patchSurvey: (patch: Partial<Survey>) => void;
  markSaved: () => void;
  selectQuestion: (sel: BuilderSelection) => void;
  setSections: (sections: Section[]) => void;
  addQuestion: (sectionId: string, question: Question) => void;
  updateQuestion: (sectionId: string, questionId: string, patch: Partial<Question>) => void;
  removeQuestion: (sectionId: string, questionId: string) => void;
  reorderQuestionsInSection: (sectionId: string, fromIndex: number, toIndex: number) => void;
};

function mapSections(survey: Survey, fn: (sections: Section[]) => Section[]): Survey {
  return { ...survey, sections: fn(survey.sections) };
}

export const useBuilderStore = create<BuilderState>((set) => ({
  survey: null,
  isDirty: false,
  selection: null,

  setSurvey: (survey) => set({ survey, isDirty: false, selection: null }),

  patchSurvey: (patch) =>
    set((s) => (s.survey ? { survey: { ...s.survey, ...patch }, isDirty: true } : s)),

  markSaved: () => set({ isDirty: false }),

  selectQuestion: (selection) => set({ selection }),

  setSections: (sections) =>
    set((s) => (s.survey ? { survey: { ...s.survey, sections }, isDirty: true } : s)),

  addQuestion: (sectionId, question) =>
    set((s) => {
      if (!s.survey) return s;
      const next = mapSections(s.survey, (secs) =>
        secs.map((sec) =>
          sec.id === sectionId ? { ...sec, questions: [...sec.questions, question] } : sec,
        ),
      );
      return {
        survey: next,
        isDirty: true,
        selection: { sectionId, questionId: question.id },
      };
    }),

  updateQuestion: (sectionId, questionId, patch) =>
    set((s) => {
      if (!s.survey) return s;
      const next = mapSections(s.survey, (secs) =>
        secs.map((sec) =>
          sec.id !== sectionId
            ? sec
            : {
                ...sec,
                questions: sec.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
              },
        ),
      );
      return { survey: next, isDirty: true };
    }),

  removeQuestion: (sectionId, questionId) =>
    set((s) => {
      if (!s.survey) return s;
      const next = mapSections(s.survey, (secs) =>
        secs.map((sec) =>
          sec.id !== sectionId
            ? sec
            : { ...sec, questions: sec.questions.filter((q) => q.id !== questionId) },
        ),
      );
      const sel = s.selection;
      const clearSel =
        sel?.questionId === questionId ? { selection: null as BuilderSelection } : {};
      return { survey: next, isDirty: true, ...clearSel };
    }),

  reorderQuestionsInSection: (sectionId, fromIndex, toIndex) =>
    set((s) => {
      if (!s.survey || fromIndex === toIndex) return s;
      const next = mapSections(s.survey, (secs) =>
        secs.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const qs = [...sec.questions];
          const [moved] = qs.splice(fromIndex, 1);
          if (!moved) return sec;
          qs.splice(toIndex, 0, moved);
          return { ...sec, questions: qs };
        }),
      );
      return { survey: next, isDirty: true };
    }),
}));
