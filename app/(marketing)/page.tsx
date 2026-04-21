'use client';

import { createClient } from '@/lib/supabase/client';

export default function Page() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="border-border bg-bg-elev text-ink-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm">
              <span className="text-accent">●</span> Phase 2 (Week 1) 진행 중
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              따뜻한 설문을 5분 만에 만들고
              <br />
              바로 공유하세요
            </h1>
            <p className="text-ink-2 mt-4 text-sm leading-6">
              공유 링크 미리보기(OG)와 빠른 응답 경험이 클릭률과 완료율을 만듭니다. Formit은 응답자
              경험을 우선으로 설계합니다.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-5 py-2.5 text-sm font-semibold text-white"
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
                className="border-border bg-bg-elev text-ink-2 hover:bg-bg-soft rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm"
                href="/templates"
              >
                템플릿 둘러보기
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border-border bg-bg-elev rounded-xl border p-4 shadow-sm">
                <div className="text-ink-3 text-xs font-semibold">공유 CTR</div>
                <div className="mt-1 text-sm font-bold">동적 OG 카드</div>
              </div>
              <div className="border-border bg-bg-elev rounded-xl border p-4 shadow-sm">
                <div className="text-ink-3 text-xs font-semibold">완료율</div>
                <div className="mt-1 text-sm font-bold">빠른 /r 경험</div>
              </div>
              <div className="border-border bg-bg-elev rounded-xl border p-4 shadow-sm">
                <div className="text-ink-3 text-xs font-semibold">리텐션</div>
                <div className="mt-1 text-sm font-bold">알림(Phase 3)</div>
              </div>
            </div>
          </div>

          <div className="border-border bg-bg-elev rounded-2xl border p-6 shadow-lg">
            <div className="bg-bg-soft rounded-xl p-5">
              <div className="text-ink-3 text-xs font-semibold">미리보기</div>
              <div className="mt-2 text-lg font-extrabold tracking-tight">📝 제품 피드백 설문</div>
              <div className="text-ink-2 mt-2 text-sm">
                응답자 UI는 섹션 단위로 진행되고, 필수 문항 검증과 진행률을 제공합니다.
              </div>
              <div className="bg-bg-elev mt-4 h-2 overflow-hidden rounded-full">
                <div className="bg-accent h-full w-2/5 rounded-full" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="border-border bg-bg-elev rounded-xl border p-4 shadow-sm">
                <div className="text-ink-3 text-xs font-semibold">Q1</div>
                <div className="mt-1 text-sm font-bold">어떤 점이 가장 좋았나요?</div>
                <div className="border-border bg-bg-soft mt-3 h-10 rounded-lg border" />
              </div>
              <div className="border-border bg-bg-elev rounded-xl border p-4 shadow-sm">
                <div className="text-ink-3 text-xs font-semibold">Q2</div>
                <div className="mt-1 text-sm font-bold">추천 의향은?</div>
                <div className="mt-3 grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div
                      key={i}
                      className={[
                        'h-8 rounded-md border',
                        i === 9 ? 'border-accent bg-accent' : 'border-border bg-bg-soft',
                      ].join(' ')}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
