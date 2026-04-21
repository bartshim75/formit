'use client';

import { createClient } from '@/lib/supabase/client';

export default function Page() {
  return (
    <main>
      <section className="mx-auto max-w-[1240px] px-6 pt-14 pb-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_540px]">
          <div className="pt-6">
            <div className="border-border bg-bg-elev text-ink-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold shadow-sm">
              <span className="text-accent">●</span> 새 설문 인사이트에 10분 투자
            </div>
            <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight md:text-6xl">
              설문을 묻기 전에,
              <br />
              <span className="text-accent">마음을 먼저 묻습니다.</span>
            </h1>
            <p className="text-ink-2 mt-5 max-w-xl text-sm leading-6">
              블록 에디터처럼 자유롭게 문항을 쌓고, 따뜻한 톤으로 응답을 받고, 한 화면에서
              인사이트까지. 바쁘게만 묻지 말고, 더 나은 질문부터 시작해보세요.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-6 py-3 text-sm font-extrabold text-white drop-shadow-sm"
                onClick={async () => {
                  const sb = createClient();
                  await sb.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                    },
                  });
                }}
              >
                Google로 시작하기
              </button>
              <a
                className="border-border bg-bg-elev text-ink-2 hover:bg-bg-soft rounded-full border px-6 py-3 text-sm font-extrabold shadow-sm"
                href="/dashboard"
              >
                데모 둘러보기
              </a>
            </div>
          </div>

          <div className="border-border rounded-[28px] border bg-white/70 p-6 shadow-lg">
            <div className="bg-bg-soft rounded-[22px] p-5">
              <div className="text-ink-3 text-xs font-extrabold">Formit · respondent</div>
              <div className="mt-2 text-sm font-extrabold tracking-tight">
                어떤 연령대에 속하시나요?
              </div>
              <div className="mt-4 grid gap-2">
                {['20대', '30대', '40대', '50대 이상'].map((t, i) => (
                  <div
                    key={t}
                    className={[
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold',
                      i === 1 ? 'border-accent bg-accent-softer' : 'border-border bg-white/60',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'h-5 w-5 rounded-full border',
                        i === 1 ? 'border-accent bg-accent' : 'border-border bg-white',
                      ].join(' ')}
                    />
                    {t}
                    {i === 1 && (
                      <div className="text-accent-ink ml-auto rounded-full bg-white px-2 py-1 text-xs font-extrabold shadow-sm">
                        +68
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1240px] px-6 py-10">
        <div className="text-center">
          <div className="text-ink-3 text-xs font-extrabold">핵심 기능</div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            블록처럼 쌓고, 자연스럽게 묻고
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['🧱', '블록 에디터', 'Notion처럼 문항을 쌓고, 순서를 바꾸고, 섹션을 나눠보세요.'],
            ['🪄', '섹션별 페이지', '응답자는 한 번에 한 섹션만 보며, 진행률과 검증을 받습니다.'],
            ['📊', '실시간 분석', '응답이 모이는 즉시 결과를 확인하고, 공유·완료율을 개선하세요.'],
            ['🎯', '브랜드 테마', '톤·색·이모지로 설문을 브랜드 경험처럼 만들 수 있어요.'],
            ['🧩', '응답기 로직', '필수/옵션, 단일 선택, 텍스트 등 기본 문항을 빠르게 구성합니다.'],
            ['🗂️', '모바일 반응형', '응답자 화면은 모바일에서 특히 편하게, 제작 화면도 안전하게.'],
          ].map(([emoji, title, desc]) => (
            <div
              key={title}
              className="border-border bg-bg-elev rounded-[22px] border p-6 shadow-sm"
            >
              <div className="text-2xl">{emoji}</div>
              <div className="mt-3 text-sm font-extrabold tracking-tight">{title}</div>
              <div className="text-ink-2 mt-2 text-xs leading-5">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 pt-2 pb-14">
        <div className="rounded-[34px] bg-[linear-gradient(90deg,#e03e6c_0%,#f0734d_50%,#f3a94f_100%)] p-10 shadow-lg md:p-14">
          <div className="mx-auto max-w-2xl text-center text-white">
            <h3 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              오늘, 첫 설문을 보내보세요
            </h3>
            <p className="mt-3 text-sm font-semibold text-white/90">
              시작하는 데 2분이면 충분해요. 첫 100개 응답까지 함께 달려요.
            </p>
            <button
              type="button"
              className="text-ink mt-6 rounded-full bg-white px-7 py-3 text-sm font-extrabold shadow-sm transition hover:bg-white/90"
              onClick={async () => {
                const sb = createClient();
                await sb.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                  },
                });
              }}
            >
              Google로 시작하기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
