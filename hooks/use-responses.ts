'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

export type ResponseRow = {
  id: string;
  survey_id: string;
  answers: unknown;
  meta: unknown;
  submitted_at: string | null;
};

export function useResponses(surveyId: string) {
  return useQuery({
    queryKey: ['responses', surveyId],
    queryFn: async (): Promise<ResponseRow[]> => {
      const sb = createClient();
      const { data, error } = await sb
        .from('responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ResponseRow[];
    },
  });
}
