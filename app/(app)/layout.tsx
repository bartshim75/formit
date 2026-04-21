import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect('/');

  return (
    <div className="bg-bg text-ink min-h-screen">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="border-border bg-bg-elev rounded-2xl border p-4 shadow-sm">
            <div className="text-ink-3 text-xs font-semibold">워크스페이스</div>
            <div className="mt-1 text-sm font-extrabold tracking-tight">내 설문</div>
            <nav className="mt-4 flex flex-col gap-1">
              <a
                className="hover:bg-bg-soft rounded-lg px-3 py-2 text-sm font-semibold"
                href="/dashboard"
              >
                대시보드
              </a>
              <a
                className="hover:bg-bg-soft rounded-lg px-3 py-2 text-sm font-semibold"
                href="/templates"
              >
                템플릿
              </a>
            </nav>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
