import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app/AppShell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect('/');

  return <AppShell>{children}</AppShell>;
}
