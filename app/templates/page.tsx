import { AppShell } from '@/components/app/AppShell';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { createClient } from '@/lib/supabase/server';
import { TEMPLATES } from '@/lib/templates';

export const revalidate = 3600;

function TemplatesContent() {
  return (
    <main className="grid gap-6">
      <section className="border-border overflow-hidden rounded-[28px] border bg-[linear-gradient(90deg,#e03e6c_0%,#f0734d_50%,#f3a94f_100%)] p-7 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold text-white">
            템플릿 갤러리
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            무엇을 알고 싶으신가요?
          </h1>
          <p className="mt-2 text-sm font-semibold text-white/90">
            검증된 템플릿으로 30초 만에 시작하세요.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              className="h-12 flex-1 rounded-2xl border border-white/25 bg-white/15 px-4 text-sm font-semibold text-white ring-0 outline-none placeholder:text-white/65 focus:border-white/40"
              placeholder="예: 신메뉴 3종 중 고객이 가장 기대하는 것"
            />
            <button
              type="button"
              className="text-ink h-12 rounded-2xl bg-white px-5 text-sm font-extrabold shadow-sm transition hover:bg-white/90"
            >
              생성
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['전체', '비즈니스', 'HR', '이벤트', '프로덕트', '교육', '마케팅', '팀'].map((t) => (
            <button
              key={t}
              type="button"
              className={[
                'rounded-full border px-4 py-2 text-xs font-extrabold transition',
                t === '전체'
                  ? 'border-ink bg-ink text-white'
                  : 'border-border bg-bg-elev text-ink-2 hover:bg-bg-soft',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <a
              key={t.id}
              href={`/s/new?template=${encodeURIComponent(t.id)}`}
              className="group border-border bg-bg-elev rounded-[24px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="h-28 rounded-t-[24px] bg-[linear-gradient(135deg,rgba(224,62,108,0.12),rgba(224,62,108,0.04))] p-5">
                <div className="text-5xl">{t.emoji}</div>
              </div>
              <div className="p-5">
                <div className="text-sm font-extrabold tracking-tight">{t.title}</div>
                <div className="text-ink-2 mt-1 line-clamp-2 text-xs leading-5">
                  {t.description}
                </div>
                <div className="text-accent-ink mt-4 flex items-center justify-end text-xs font-extrabold">
                  사용하기 <span className="ml-1 transition group-hover:translate-x-0.5">›</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

export default async function Page() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (user) {
    return (
      <AppShell>
        <TemplatesContent />
      </AppShell>
    );
  }

  return (
    <MarketingShell>
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <TemplatesContent />
      </div>
    </MarketingShell>
  );
}
