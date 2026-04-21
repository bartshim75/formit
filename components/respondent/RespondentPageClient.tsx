'use client';

import { RespondentForm } from '@/components/respondent/RespondentForm';
import { captureEvent } from '@/lib/analytics';
import type { Survey } from '@/types/survey';

type Props = {
  surveyId: string;
  survey: Survey;
};

export function RespondentPageClient({ surveyId, survey }: Props) {
  return (
    <RespondentForm
      survey={survey}
      publicMode
      onSubmit={async (answers) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surveyId, answers, tz }),
        });
        if (!res.ok) throw new Error('제출에 실패했어요. 잠시 후 다시 시도해주세요.');
        const body = (await res.json()) as { id?: string };
        captureEvent('respondent_submitted_client', {
          survey_id: surveyId,
          response_id: body.id,
        });
      }}
    />
  );
}
