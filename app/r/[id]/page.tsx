import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { RespondentPageClient } from '@/components/respondent/RespondentPageClient';
import { createClient } from '@/lib/supabase/server';
import { fromDbSurvey } from '@/types/survey';

export const revalidate = 60;

async function fetchLiveSurvey(id: string) {
  const sb = await createClient();
  const { data, error } = await sb
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('status', 'live')
    .maybeSingle();

  if (error) return null;
  return data ? fromDbSurvey(data) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const survey = await fetchLiveSurvey(id);
  if (!survey) return { title: '설문을 찾을 수 없어요 — Formit' };
  return {
    title: `${survey.emoji} ${survey.title} — Formit`,
    description: survey.description ?? '지금 이 설문에 참여해 주세요',
    openGraph: {
      images: [`/r/${id}/opengraph-image`],
      type: 'website',
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await fetchLiveSurvey(id);
  if (!survey) notFound();

  return <RespondentPageClient survey={survey} surveyId={id} />;
}
