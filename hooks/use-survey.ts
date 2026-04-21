'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import { fromDbSurvey } from '@/types/survey';

export function useSurvey(id: string) {
  return useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const sb = createClient();
      const { data, error } = await sb.from('surveys').select('*').eq('id', id).single();
      if (error) throw error;
      return fromDbSurvey(data);
    },
  });
}
