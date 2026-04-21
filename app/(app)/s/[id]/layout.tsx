import type { ReactNode } from 'react';

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-ink-3 text-xs font-semibold">설문</div>
          <div className="mt-1 text-lg font-extrabold tracking-tight">{id}</div>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold"
            href={`/s/${id}/edit`}
          >
            편집
          </a>
          <a
            className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold"
            href={`/s/${id}/share`}
          >
            공유
          </a>
          <a
            className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold"
            href={`/s/${id}/results`}
          >
            결과
          </a>
        </div>
      </div>
      {children}
    </div>
  );
}
