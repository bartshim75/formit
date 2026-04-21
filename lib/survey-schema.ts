import { z } from 'zod';

export const QuestionTypeSchema = z.enum([
  // target state (ARCHITECTURE.md)
  'short_text',
  'long_text',
  'single_choice',
  'multi_choice',
  'scale',
  'nps',
  'rating',
  'date',
  'email',
  'section_intro',
  // legacy(Formit.html) 호환 (Phase 1~2 이식 중)
  'short',
  'long',
  'single',
  'multi',
  'likert',
  'rank',
  'image',
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

const OptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(OptionSchema).optional(),
  scale: z
    .object({
      min: z.number(),
      max: z.number(),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional(),
    })
    .optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(QuestionSchema),
});
export type Section = z.infer<typeof SectionSchema>;

export const SectionsSchema = z.array(SectionSchema);
export type Sections = z.infer<typeof SectionsSchema>;

export const ResponseSubmitSchema = z.object({
  surveyId: z.string().uuid(),
  answers: z.record(z.string(), z.unknown()),
  tz: z.string().optional(),
});
export type ResponseSubmit = z.infer<typeof ResponseSubmitSchema>;
