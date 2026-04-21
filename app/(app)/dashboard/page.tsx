import { DashboardClient } from './DashboardClient';

import { createClient } from '@/lib/supabase/server';
import { fromDbSurvey } from '@/types/survey';

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb.from('surveys').select('*').order('updated_at', { ascending: false });
  const initial = (data ?? []).map(fromDbSurvey);
  return <DashboardClient initialSurveys={initial} />;
}
