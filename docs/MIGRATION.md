# Formit — Strangler Fig 마이그레이션 플레이북

> **언제**: Phase 0 후반 ~ Phase 2 종료
> **원칙**: 프로덕션 다운타임 0초. 언제든 직전 상태로 되돌릴 수 있다.
> **기반 문서**: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`ROADMAP.md`](./ROADMAP.md)

---

## 목차

1. [전략 개요](#1-전략-개요)
2. [단계별 트래픽 라우팅 (vercel.json)](#2-단계별-트래픽-라우팅-verceljson)
3. [호환성: 기존 링크 · 북마크 · QR](#3-호환성-기존-링크--북마크--qr)
4. [데이터 · 세션 호환성](#4-데이터--세션-호환성)
5. [배포 순서 (Phase별)](#5-배포-순서-phase별)
6. [비교 운영 (Shadow Mode)](#6-비교-운영-shadow-mode)
7. [롤백 플레이북](#7-롤백-플레이북)
8. [최종 정리 (legacy 제거)](#8-최종-정리-legacy-제거)
9. [체크리스트](#9-체크리스트)

---

## 1. 전략 개요

### 상태 변화

```
[현재]   Vercel ──serve── dist/index.html  (단일 HTML, 3.7k 라인)

[Phase 0 끝]
         Vercel ──Next.js build──┐
                                 ├── /api/health → 200 (확인용)
                                 └── 그 외 전부 fallback → legacy/Formit.html

[Phase 1 끝]
         Vercel ──Next.js──┬── /r/[id]         → 신규 SSR ★
                           ├── /r/[id]/opengraph-image
                           ├── /api/responses
                           └── 그 외 fallback → legacy/Formit.html

[Phase 2 Week1 끝]
         Vercel ──Next.js──┬── / (랜딩)
                           ├── /templates
                           ├── /dashboard
                           ├── /r/[id], /api/*
                           └── /s/* → fallback (legacy 빌더/공유/결과)

[Phase 2 Week3 끝]
         Vercel ──Next.js── 전체. legacy 삭제.
```

### 왜 Strangler Fig인가

- 트래픽 이전이 **경로 단위**로 가능 → 신규/레거시 혼용 기간 안전
- 회귀 발견 즉시 해당 경로만 legacy로 되돌릴 수 있음
- 사용자에게 일관된 도메인 제공 (`formit.vercel.app`)

---

## 2. 단계별 트래픽 라우팅 (vercel.json)

### 2.0 현재 (Phase 0 직전)

```json
{
  "buildCommand": "./scripts/build.sh",
  "outputDirectory": "dist",
  "cleanUrls": true
}
```

### 2.1 Phase 0 종료 시점

Next.js가 메인, legacy는 `public/legacy/`로 이동 후 fallback.

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/api/health", "destination": "/api/health" },
    {
      "source": "/:path*",
      "destination": "/legacy/index.html",
      "has": [{ "type": "header", "key": "x-formit-legacy", "value": "1" }]
    }
  ],
  "headers": [
    /* 기존 보안 헤더 유지 */
  ]
}
```

> **중요**: Phase 0에서는 실제 유저 트래픽은 여전히 legacy로 가야 합니다.
> Next.js 앱은 `/api/health`만 붙이고, 루트 `/`도 "공사 중" 같은 placeholder가 아니라 **기존 legacy로 rewrite** 합니다 (아래 2.2 참조).

### 2.2 Phase 0 실전 rewrites (legacy가 기본)

```json
{
  "rewrites": [
    { "source": "/api/health", "destination": "/api/health" },
    { "source": "/_next/:path*", "destination": "/_next/:path*" },
    { "source": "/:path*", "destination": "/legacy/index.html" }
  ]
}
```

> `public/legacy/index.html`은 기존 `dist/index.html`의 내용과 동일. `scripts/build.sh`를 수정해 `public/legacy/index.html`로 산출물을 쓰도록 변경합니다.

### 2.3 Phase 1 종료 시점

응답자 라우트만 신규, 나머지는 legacy.

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/_next/:path*", "destination": "/_next/:path*" },
    { "source": "/r/:id", "destination": "/r/:id" },
    { "source": "/r/:id/opengraph-image", "destination": "/r/:id/opengraph-image" },
    { "source": "/r/:id/twitter-image", "destination": "/r/:id/twitter-image" },
    { "source": "/:path*", "destination": "/legacy/index.html" }
  ]
}
```

Next.js 라우트가 존재하는 경로는 Vercel이 자동으로 해당 페이지를 serve하므로 **위 rewrite의 마지막 규칙은 "일치하지 않은 나머지만 legacy로"라는 의미**가 됩니다.

### 2.4 Phase 2 Week1 종료

랜딩·템플릿·대시보드까지 신규 전환.

```json
{
  "rewrites": [
    { "source": "/", "destination": "/" },
    { "source": "/templates", "destination": "/templates" },
    { "source": "/pricing", "destination": "/pricing" },
    { "source": "/dashboard", "destination": "/dashboard" },
    { "source": "/auth/:path*", "destination": "/auth/:path*" },
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/_next/:path*", "destination": "/_next/:path*" },
    { "source": "/r/:path*", "destination": "/r/:path*" },
    { "source": "/:path*", "destination": "/legacy/index.html" }
  ]
}
```

실제로는 Next.js에 해당 라우트가 존재하면 rewrites를 명시적으로 쓰지 않아도 되지만, **legacy fallback을 마지막 catch-all로 두기 위해 전 규칙을 순서로 넣는 것이 안전**합니다.

### 2.5 Phase 2 Week3 종료 (legacy 제거 직전)

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/legacy/index.html",
      "has": [{ "type": "cookie", "key": "formit_use_legacy", "value": "1" }]
    }
  ]
}
```

특정 쿠키를 심은 유저만 legacy로 폴백 가능 → 카나리 형태로 1주일 관찰 후 다음 단계.

### 2.6 Phase 2 Week3 완료

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    /* 보안 헤더 */
  ]
}
```

rewrites 전부 제거. `public/legacy/` 디렉토리 삭제.

---

## 3. 호환성: 기존 링크 · 북마크 · QR

### 3.1 기존 공유 링크 형태

현 Formit.html은 **해시 라우팅**을 사용:

```
https://formit.vercel.app/#/r/<survey-id>
```

### 3.2 Phase 1 이후 신규 형태

```
https://formit.vercel.app/r/<survey-id>
```

### 3.3 호환 처리

1. **서버 단**: `/`로 들어온 요청이 `#/r/<id>` 해시를 가져도 서버는 hash를 볼 수 없음. 클라이언트 스크립트로 처리.
2. **신규 랜딩(`app/(marketing)/page.tsx`)에 smoothredirect 스니펫 삽입**:
   ```tsx
   // 최상단 use client 컴포넌트
   useEffect(() => {
     const m = window.location.hash.match(/^#\/r\/([0-9a-f-]{36})/);
     if (m) window.location.replace(`/r/${m[1]}`);
   }, []);
   ```
3. **레거시 페이지에도 동일 스니펫을 추가**해, Phase 0~1 기간 방문자도 신규 응답자 UI로 보내기:
   - `Formit.html`의 `App` 컴포넌트 초기 로직에서 hash 감지 시 `location.replace('/r/<id>')`
4. **QR 코드**: `share.tsx`에서 QR이 생성하는 URL이 상대경로가 아닌 절대경로 `window.location.origin + '/r/' + id`가 되도록 Phase 1 배포 시 함께 배포. 이미 생성된 QR은 hash 링크를 담고 있을 수 있으므로 3.3.2의 redirect로 자동 구제.

### 3.4 커스텀 도메인

- Phase 2 이전: `formit.vercel.app`만 사용
- Phase 3: 커스텀 도메인 붙일 경우 Google OAuth / Supabase Redirect URL에 추가 필요 (`supabase/SETUP.md` 참고)

---

## 4. 데이터 · 세션 호환성

### 4.1 Supabase 세션

- 기존 `Formit.html`은 `@supabase/supabase-js` UMD의 **브라우저 메모리 세션 + localStorage**를 사용 (기본 설정)
- 신규 Next.js는 `@supabase/ssr`이 **쿠키 기반 세션**을 사용
- **전환 순간 로그인 상태가 끊길 수 있음** → Phase 2 랜딩 이전 후 최초 1회 재로그인 필요
- 공지: 대시보드 진입 시 "보안 업데이트로 한 번 다시 로그인해 주세요" 토스트

### 4.2 DB 스키마

Phase 0~2는 스키마 **변경 없음**. 기존 RLS/테이블 그대로 사용.
Phase 3부터 `workspaces`, `subscriptions` 등 확장.

### 4.3 Public anon 키

- 클라이언트에 노출되는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 기존과 동일 값
- Vercel 환경변수 이름만 `SUPABASE_URL/ANON_KEY` → `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`로 변경
- `legacy/Formit.html`의 `window.__FORMIT_CONFIG`도 빌드 시 동일 값 주입 유지 (build script 수정)

### 4.4 환경변수 마이그레이션

| 기존                | 신규                            | 비고                                                       |
| ------------------- | ------------------------------- | ---------------------------------------------------------- |
| `SUPABASE_URL`      | `NEXT_PUBLIC_SUPABASE_URL`      | Vercel에 둘 다 유지 (legacy build가 `SUPABASE_URL`을 읽음) |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 동일                                                       |
| —                   | `UPSTASH_REDIS_REST_URL`        | Phase 1                                                    |
| —                   | `UPSTASH_REDIS_REST_TOKEN`      | Phase 1                                                    |
| —                   | `POSTHOG_KEY` (public)          | Phase 1                                                    |
| —                   | `IP_HASH_SALT`                  | Phase 1                                                    |
| —                   | `RESEND_API_KEY`                | Phase 3 (Supabase Functions Secret)                        |
| —                   | `STRIPE_*`                      | Phase 3                                                    |

---

## 5. 배포 순서 (Phase별)

### 5.1 Phase 0 배포 순서

1. PR 1: Next.js 스캐폴드 + `legacy/Formit.html`로 이전 + `vercel.json` 업데이트
2. Vercel Preview 확인 → 기존 UI가 legacy 경로로 정상 동작
3. Production 머지 → 유저에게는 변화 없음
4. PR 2: 토큰·Supabase·zod·분석 설정 (UI 변화 없음)

### 5.2 Phase 1 배포 순서 (가장 긴장)

1. PR: `/r/[id]` 신규 라우트 + OG + rate-limit + rewrites 업데이트
2. **Preview에서 반드시**:
   - `/r/<실제-live-설문-id>` 접근 → 신규 UI
   - 응답 제출 → Supabase에 row 생성 확인
   - OG URL 카톡 공유 → 프리뷰 렌더
3. Production 배포
4. **첫 1시간 집중 모니터링**:
   - PostHog `respondent_viewed` 실시간 카운트
   - Supabase `responses` insert 속도
   - Vercel Functions 실행 시간
5. **이상 시**: §7.1 롤백

### 5.3 Phase 2 배포 순서

주 단위로 쪼개 머지:

1. Week 1 PR (marketing + dashboard) — legacy의 대시보드와 **병행 가능** (OAuth 세션 분리 주의)
2. Week 2 PR (builder) — legacy의 빌더는 동시에 사라짐. 이 주에 회귀가 가장 많을 수 있음
3. Week 3 PR (share + results + legacy 제거) — **Week 3 머지 전 1주일 병행 관찰 필수**

### 5.4 Phase 3~4

독립 기능별 PR, feature flag로 단계 공개.

---

## 6. 비교 운영 (Shadow Mode)

### 6.1 왜 필요한가

Phase 1~2 기간, 동일 설문을 신규/legacy에서 동시 볼 수 있도록 해 **회귀 감지**.

### 6.2 구현

- 쿠키 `formit_variant=new|legacy`를 수동 설정 가능한 관리 페이지 `/admin/variant` (개발자만)
- `vercel.json`의 rewrites에 `has: [{ "type":"cookie", "key":"formit_variant", "value":"legacy" }]` 조건 추가
- 팀 내부에서 legacy로 강제 전환해 비교

### 6.3 지표 비교

- PostHog에서 variant 속성으로 퍼널 분리 측정
- 응답 완료율, LCP, 에러율을 주간 비교
- 2주 연속 new variant가 legacy보다 좋거나 동등하면 legacy 제거

---

## 7. 롤백 플레이북

### 7.1 Phase 1 롤백 (응답자 라우트 회귀)

**감지**: PostHog `respondent_submitted`가 시간당 평소 대비 -50% 이상

1. Vercel Dashboard → Deployments → 직전 배포 Promote
   - `/r/:id*`가 legacy로 돌아감
   - OG 이미지 URL은 동일 경로이므로 legacy HTML의 static OG로 폴백됨 (개별 OG는 잃지만 사이트는 살아남)
2. Slack 알림 + 사유 기록
3. 원인 파악 후 핫픽스 → 재배포

### 7.2 Phase 2 롤백 (대시보드/빌더 회귀)

**감지**: Sentry 에러율 급증, 고객 CS 인입

1. Vercel Rollback → 직전 Production
2. legacy의 해당 영역이 되살아남
3. DB 변경 없었으므로 데이터 무손상

### 7.3 Phase 2.3.3 이후 롤백 (legacy 삭제된 상태)

- Git history에서 `legacy/Formit.html` 삭제 커밋 이전으로 revert 필요
- 이 단계는 **절대 급하게 수행하지 말 것**. 1주일 병행 운영 기간을 반드시 지킬 것
- revert 시: `public/legacy/index.html` 복구 + `vercel.json`의 fallback rewrite 복구

### 7.4 DB 롤백 (Phase 3+)

- 모든 migration은 `20260501000000_name.sql` + `20260501000000_name.down.sql` 쌍
- Supabase CLI로 `supabase db reset` 또는 수동 `psql` 실행
- 운영 DB에는 down 스크립트를 신중히 적용 (팀 리뷰 필수)

---

## 8. 최종 정리 (legacy 제거)

### 8.1 체크리스트

실시 전 다음을 모두 확인:

- [ ] 모든 신규 라우트 Vercel Analytics에서 정상 트래픽 수신 중 (1주일 이상)
- [ ] legacy 쿠키로 접근 시도한 유저 수 < 0.1% (24시간 기준)
- [ ] Sentry에서 신규 빌드 에러율이 이전 2주 평균 이하
- [ ] PostHog `respondent_submitted`가 이전 2주 평균 이상
- [ ] Core Web Vitals 예산 미초과
- [ ] 팀 전원에게 "legacy 제거" 공지 완료

### 8.2 실행 순서

```bash
# 1. legacy shadow 모드 쿠키를 가진 유저들을 강제 새 UI로 유도
#    (admin 페이지에서 쿠키 expire)

# 2. PR 생성
git switch -c chore/remove-legacy
git rm -r public/legacy
git rm scripts/build.sh  # 또는 legacy-build.sh로 이름 변경만
# vercel.json에서 legacy 관련 rewrites 전부 제거
git commit -m "chore(migration): remove legacy Formit.html fallback"

# 3. Preview 배포 확인 → 모든 라우트 신규 동작
# 4. Production 머지
# 5. 최소 24시간 모니터링
```

### 8.3 실패 시

- 8.1 체크리스트 중 하나라도 미달이면 1주일 연기
- 정말 불가피하면 `public/legacy/`를 유지한 채 `vercel.json`만 신규 routing으로 유지 (동작 동일, 리포지토리만 두껍)

---

## 9. 체크리스트 (실행자용 단일 페이지)

### Phase 0

- [ ] `legacy/Formit.html` 이전, `scripts/build.sh` 경로 수정
- [ ] Next.js 스캐폴드, TS strict, Tailwind, tokens.css
- [ ] Supabase client/server/admin 3종 분리, `server-only` 가드
- [ ] `vercel.json`: 기본은 legacy로 rewrite
- [ ] `/api/health` 200

### Phase 1

- [ ] `/r/[id]` SSR + `generateMetadata`
- [ ] `/r/[id]/opengraph-image` Edge Runtime
- [ ] `/api/responses` + rate-limit + zod
- [ ] Hash redirect 스니펫 (legacy + 신규 랜딩)
- [ ] `vercel.json`: `/r/:id*`, `/r/:id/opengraph-image`, `/api/*` 신규. 그 외 legacy
- [ ] PostHog 응답자 퍼널
- [ ] 카톡 OG 수동 확인

### Phase 2 Week1

- [ ] 랜딩·템플릿 SSG 이식
- [ ] `(app)/layout` 세션 가드
- [ ] `/dashboard` 이식 + TanStack Query
- [ ] `vercel.json` 갱신

### Phase 2 Week2

- [ ] Zustand 빌더 스토어 + autosave
- [ ] `/s/[id]/edit` 이식 (@dnd-kit)

### Phase 2 Week3

- [ ] `/s/[id]/share` 이식
- [ ] `/s/[id]/results` 이식
- [ ] 1주일 병행 관찰
- [ ] legacy 제거 PR
- [ ] README 갱신

### Phase 3

- [ ] Resend + Edge Function notify-response
- [ ] workspaces 스키마 + UI
- [ ] Stripe + /pricing + /billing
- [ ] 로직 점프, CSV export, 웹훅

### Phase 4

- [ ] AI 요약
- [ ] A/B, Feature Flags
- [ ] i18n + PWA
- [ ] 공개 API + Zapier
