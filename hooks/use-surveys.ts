'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { Survey } from '@/types/survey';
import { fromDbSurvey } from '@/types/survey';

export function useSurveys() {
  return useQuery({
    queryKey: ['surveys'],
    queryFn: async (): Promise<Survey[]> => {
      const sb = createClient();
      const { data, error } = await sb
        .from('surveys')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(fromDbSurvey);
    },
  });
}
