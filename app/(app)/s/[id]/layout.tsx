import type { ReactNode } from 'react';

import { SurveyHeader } from '@/components/app/SurveyHeader';

export default async function SurveyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <SurveyHeader id={id} />
      {children}
    </div>
  );
}
