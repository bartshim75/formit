import { TEMPLATES } from '@/lib/templates';

export const revalidate = 3600;

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight">템플릿</h1>
        <p className="text-ink-2 mt-2 text-sm leading-6">
          자주 쓰는 설문 형태를 템플릿으로 시작하세요. (Phase 2에서는 우선 하드코딩, 향후 DB 이관)
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <a
            key={t.id}
            href={`/s/new?template=${encodeURIComponent(t.id)}`}
            className="group border-border bg-bg-elev rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-4xl">{t.emoji}</div>
            <div className="mt-3 text-lg font-extrabold tracking-tight">{t.title}</div>
            <div className="text-ink-2 mt-1 text-sm">{t.description}</div>
            <div className="border-border bg-bg-soft text-ink-2 group-hover:border-border-strong mt-6 inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
              이 템플릿으로 시작
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
