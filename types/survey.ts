import type { z } from 'zod';

import type { Database } from '@/types/db';
import { SectionsSchema } from '@/lib/survey-schema';

export const SURVEY_STATUS = { Draft: 'draft', Live: 'live', Closed: 'closed' } as const;
export type SurveyStatus = (typeof SURVEY_STATUS)[keyof typeof SURVEY_STATUS];

export type DbSurveyRow = Database['public']['Tables']['surveys']['Row'];

export type Survey = {
  id: string;
  ownerId: string;
  workspaceId?: string | null;
  title: string;
  description?: string;
  emoji: string;
  color?: string;
  status: SurveyStatus;
  sections: z.infer<typeof SectionsSchema>;
  settings: Record<string, unknown>;
  notifyEmail?: boolean | null;
  notifyThreshold?: number | null;
  webhookUrl?: string | null;
  variants?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export function fromDbSurvey(row: DbSurveyRow): Survey {
  const sections = SectionsSchema.parse(row.sections ?? []);
  const statusRaw = row.status ?? SURVEY_STATUS.Draft;
  const status =
    statusRaw === 'live' || statusRaw === 'closed' || statusRaw === 'draft' ? statusRaw : 'draft';

  const base: Survey = {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title ?? '',
    emoji: row.emoji ?? '📝',
    status,
    sections,
    settings:
      (row.settings && typeof row.settings === 'object'
        ? (row.settings as Record<string, unknown>)
        : {}) ?? {},
  };

  if (row.workspace_id != null) base.workspaceId = row.workspace_id;
  if (row.description != null) base.description = row.description;
  if (row.color != null) base.color = row.color;
  if (row.notify_email != null) base.notifyEmail = row.notify_email;
  if (row.notify_threshold != null) base.notifyThreshold = row.notify_threshold;
  if (row.webhook_url != null) base.webhookUrl = row.webhook_url;
  if (row.variants != null && typeof row.variants === 'object' && !Array.isArray(row.variants)) {
    base.variants = row.variants as Record<string, unknown>;
  }
  if (row.created_at != null) base.createdAt = row.created_at;
  if (row.updated_at != null) base.updatedAt = row.updated_at;

  return base;
}

export function toDbSurvey(
  survey: Survey,
): Database['public']['Tables']['surveys']['Update'] & { id: string; owner_id: string } {
  const base: Database['public']['Tables']['surveys']['Update'] & {
    id: string;
    owner_id: string;
  } = {
    id: survey.id,
    owner_id: survey.ownerId,
    title: survey.title,
    description: survey.description ?? null,
    emoji: survey.emoji,
    color: survey.color ?? null,
    status: survey.status,
    sections: survey.sections,
    settings: survey.settings,
  };

  if (survey.workspaceId !== undefined) base.workspace_id = survey.workspaceId;
  if (survey.notifyEmail !== undefined) base.notify_email = survey.notifyEmail;
  if (survey.notifyThreshold !== undefined) base.notify_threshold = survey.notifyThreshold;
  if (survey.webhookUrl !== undefined) base.webhook_url = survey.webhookUrl;
  if (survey.variants !== undefined) base.variants = survey.variants;

  if (survey.updatedAt != null) base.updated_at = survey.updatedAt;

  return base;
}
