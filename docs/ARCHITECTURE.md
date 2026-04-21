# Formit — Architecture

> 버전: v1.0 · 작성일: 2026-04-21
> 본 문서는 Formit의 목표 아키텍처(target state)를 정의합니다.
> 현재 상태(`Formit.html` 단일 파일)에서 이 구조로 전환하는 구체 절차는 [`MIGRATION.md`](./MIGRATION.md)를 참조하세요.

---

## 목차

1. [제품 개요 · 성장 가설](#1-제품-개요--성장-가설)
2. [아키텍처 원칙](#2-아키텍처-원칙)
3. [기술 스택](#3-기술-스택)
4. [디렉토리 구조](#4-디렉토리-구조)
5. [렌더링 전략 (라우트별)](#5-렌더링-전략-라우트별)
6. [데이터 모델](#6-데이터-모델)
7. [인증 · 권한](#7-인증--권한)
8. [디자인 시스템](#8-디자인-시스템)
9. [상태 관리](#9-상태-관리)
10. [Supabase 사용 규약](#10-supabase-사용-규약)
11. [API · Edge Functions](#11-api--edge-functions)
12. [보안 · 남용 방지](#12-보안--남용-방지)
13. [성능 예산](#13-성능-예산)
14. [관측 · 분석](#14-관측--분석)
15. [환경 · 비밀 관리](#15-환경--비밀-관리)
16. [CI/CD](#16-cicd)
17. [테스트 전략](#17-테스트-전략)
18. [장애 · 롤백 · 백업](#18-장애--롤백--백업)
19. [결정 기록 (ADR)](#19-결정-기록-adr)

---

## 1. 제품 개요 · 성장 가설

**Formit**은 "마케터/기획자가 5분 안에 따뜻한 설문을 만들고 바로 공유"하는 한국어 설문 플랫폼입니다.

### 바이럴 루프 (이 루프를 최적화하는 것이 아키텍처의 1순위 목표)

```
  제작자 설문 생성
        │
        ▼
  링크 공유 (카톡/슬랙/LinkedIn)
        │   ← 여기서 OG 프리뷰가 클릭률을 결정
        ▼
  응답자 방문 (/r/[id])
        │   ← 여기서 LCP/TTI가 이탈율을 결정
        ▼
  응답 제출
        │
        ▼
  제작자 알림 수신 (이메일/Slack)
        │   ← 여기서 제작자 D7 리텐션이 결정
        ▼
  새 설문 제작 → 다시 위로
```

### 핵심 지표 (North Star & Inputs)

- **North Star**: 주간 활성 응답 제출 수 (Weekly Responses Submitted)
- **Input Metrics**:
  - 설문 공유 링크 CTR (OG 프리뷰 최적화로 개선)
  - 응답자 LCP, 완료율 (번들 최적화로 개선)
  - 제작자 D7/D30 리텐션 (알림으로 개선)
  - 제작자당 평균 응답 수 (공유 UX로 개선)

---

## 2. 아키텍처 원칙

| #   | 원칙                                   | 실천                                                                                       |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | **응답자 경험 우선**                   | `/r/[id]`는 서버 렌더링·최소 번들·OG 동적 생성                                             |
| 2   | **RLS를 사실상의 유일한 권한 경계로**  | 클라이언트·서버 모두 `anon`/`authenticated` 키만 사용. `service_role`은 Edge Function 전용 |
| 3   | **서버 상태와 클라이언트 상태 분리**   | TanStack Query = 서버, Zustand = 로컬(빌더)                                                |
| 4   | **점진 마이그레이션**                  | Strangler Fig. 모든 PR은 독립 롤백 가능                                                    |
| 5   | **디자인 토큰 단일 원천**              | `styles/tokens.css`의 CSS 변수가 유일한 컬러·간격 원천. Tailwind 설정은 이 토큰을 참조     |
| 6   | **관측되지 않는 것은 출시되지 않는다** | 모든 주요 액션은 PostHog 이벤트 + Supabase 로그                                            |
| 7   | **비용은 사용자 수에 비례**            | 무료 티어 기반 스택 선정. Edge Function은 요청 기반                                        |

---

## 3. 기술 스택

### 3.1 런타임 · 프레임워크

| 레이어        | 선택            | 버전              | 이유                                                    |
| ------------- | --------------- | ----------------- | ------------------------------------------------------- |
| 프레임워크    | **Next.js**     | 15.x (App Router) | Vercel 최적, RSC, `generateMetadata`, `opengraph-image` |
| 언어          | **TypeScript**  | 5.x (strict)      | 설문 JSONB 스키마 타이핑                                |
| Node          | **Node 20 LTS** |                   | Vercel 기본                                             |
| 패키지 매니저 | **pnpm**        | 9.x               | workspaces 대비, lockfile 속도                          |

### 3.2 UI · 스타일

| 레이어      | 선택                                            | 이유                                     |
| ----------- | ----------------------------------------------- | ---------------------------------------- |
| CSS         | **Tailwind v4** + 기존 CSS 변수 토큰            | 토큰 보존 · 유틸리티 속도                |
| 헤드리스 UI | **Radix UI primitives** (shadcn generator 사용) | behavior(A11y·키보드·포커스 트랩)만 차용 |
| 폰트        | Pretendard · Inter · JetBrains Mono             | 기존 유지. `next/font`로 셀프 호스팅     |
| 아이콘      | **lucide-react**                                | 현재 `Icon` 컴포넌트 대체                |
| DnD (빌더)  | **@dnd-kit/core + sortable**                    | 접근성·성능                              |
| 차트 (결과) | **recharts**                                    | React 친화, 번들 적정                    |

> **shadcn 사용 규약**: `npx shadcn@latest add` 후 생성된 파일의 className을 **제거**하고 `components/ui/*`에서 Tailwind + 토큰 기반 스타일로 재작성합니다. 로직(`Radix` primitive 래핑, 변형 props 등)만 유지합니다. 자세히는 [`CONVENTIONS.md §4`](./CONVENTIONS.md#4-shadcn-사용-규약) 참조.

### 3.3 데이터 · 서버

| 레이어              | 선택                                      | 이유                         |
| ------------------- | ----------------------------------------- | ---------------------------- |
| DB · Auth · Storage | **Supabase** (현행 유지)                  | 기존 자산·RLS·Realtime       |
| ORM/쿼리            | **@supabase/supabase-js + @supabase/ssr** | RSC·Route Handler 지원       |
| 스키마 검증         | **zod**                                   | `sections` JSONB 런타임 검증 |
| DB 타입             | `supabase gen types typescript`           | `types/db.ts` 자동 생성      |
| 서버 함수           | **Supabase Edge Functions (Deno)**        | 알림·export·웹훅             |
| 이메일              | **Resend**                                | Next.js/React Email 친화     |
| 결제                | **Stripe** (Phase 3)                      | 한국 카드 + 정기 결제        |
| Rate Limit          | **Upstash Redis**                         | Edge 호환, 무료 티어 충분    |

### 3.4 클라이언트 상태 · 유틸

| 레이어    | 선택                                            |
| --------- | ----------------------------------------------- |
| 서버 상태 | **@tanstack/react-query** v5                    |
| 로컬 상태 | **zustand** (빌더 전용)                         |
| URL 상태  | **nuqs** 또는 `useSearchParams`                 |
| 폼        | **react-hook-form + @hookform/resolvers (zod)** |
| 날짜      | **date-fns** (ko locale)                        |

### 3.5 관측 · 분석 · 품질

| 레이어    | 선택                                                   |
| --------- | ------------------------------------------------------ |
| 제품 분석 | **PostHog** (self-host 가능, 시작은 cloud)             |
| 에러 추적 | **Sentry** (선택, Phase 2 도입)                        |
| E2E       | **Playwright**                                         |
| Unit      | **Vitest**                                             |
| Lint      | **ESLint** (next/core-web-vitals + @typescript-eslint) |
| Format    | **Prettier**                                           |
| Git Hook  | **lefthook**                                           |
| 성능 회귀 | **@lhci/cli** (Lighthouse CI, PR 체크)                 |

---

## 4. 디렉토리 구조

```
formit/
├── app/                                # Next.js App Router (모든 라우트)
│   ├── (marketing)/                    # 그룹: SSG 퍼블릭
│   │   ├── layout.tsx                  # 심플 헤더
│   │   ├── page.tsx                    # 랜딩 / 기존 Landing.jsx 이식
│   │   ├── pricing/page.tsx            # Phase 3
│   │   └── templates/page.tsx          # 공개 템플릿 갤러리
│   │
│   ├── (app)/                          # 그룹: 인증 필요 · CSR 우선
│   │   ├── layout.tsx                  # Sidebar + auth gate (RSC에서 세션 확인)
│   │   ├── dashboard/page.tsx          # 내 설문 목록
│   │   ├── s/[id]/
│   │   │   ├── layout.tsx              # 설문 탭 공용 (Edit/Share/Results)
│   │   │   ├── edit/page.tsx           # Builder
│   │   │   ├── share/page.tsx
│   │   │   └── results/page.tsx
│   │   └── settings/
│   │       ├── page.tsx                # 프로필
│   │       └── workspace/page.tsx      # Phase 3
│   │
│   ├── r/[id]/                         # ★ 응답자 · SSR + ISR
│   │   ├── page.tsx                    # 서버에서 설문 fetch → 클라이언트에 hydrate
│   │   ├── opengraph-image.tsx         # Edge Runtime 동적 OG 이미지
│   │   ├── twitter-image.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   │
│   ├── api/                            # Route Handlers
│   │   ├── responses/route.ts          # POST 응답 제출 (rate-limit + 서버 validate)
│   │   ├── surveys/[id]/count/route.ts # 응답 수 (ISR 캐시)
│   │   ├── exports/[id]/route.ts       # CSV 스트림 (Phase 3)
│   │   └── webhooks/
│   │       └── stripe/route.ts         # Phase 3
│   │
│   ├── auth/
│   │   └── callback/route.ts           # Supabase OAuth 콜백
│   │
│   ├── layout.tsx                      # 루트 레이아웃 (font, PostHog)
│   ├── globals.css                     # tokens.css + Tailwind directives
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── builder/                        # 빌더 전용
│   │   ├── BlockList.tsx
│   │   ├── QuestionBlock.tsx
│   │   ├── AddBlockMenu.tsx
│   │   ├── Inspector.tsx
│   │   └── useBuilderStore.ts          # zustand
│   ├── respondent/                     # 응답자 전용
│   │   ├── RespondentForm.tsx
│   │   ├── QuestionRenderer.tsx
│   │   └── SectionIntro.tsx
│   ├── results/
│   │   ├── NPSGauge.tsx
│   │   ├── ResponsesTimeline.tsx
│   │   └── QuestionResultCard.tsx
│   ├── shared/                         # 앱 공통
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── Avatar.tsx
│   │   ├── StatusDot.tsx
│   │   ├── Toast.tsx
│   │   └── EmptyState.tsx
│   └── ui/                             # shadcn 기반 프리미티브 (behavior만)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # 브라우저 전용 (anon)
│   │   ├── server.ts                   # RSC/Route Handler (cookies)
│   │   ├── admin.ts                    # Edge Function 전용 (service_role)
│   │   └── types.ts                    # 래퍼 타입
│   ├── analytics.ts                    # PostHog 래퍼
│   ├── rate-limit.ts                   # Upstash 래퍼
│   ├── og.ts                           # OG 이미지 생성 유틸
│   ├── survey-schema.ts                # zod 스키마 (sections, question types)
│   ├── survey-utils.ts                 # pure fn (이전 data.jsx 유틸)
│   ├── i18n.ts                         # Phase 3
│   └── utils.ts                        # cn(), 포맷터 등
│
├── hooks/
│   ├── useSurveys.ts                   # TanStack Query
│   ├── useSurvey.ts
│   ├── useResponses.ts
│   ├── useAuth.ts
│   └── useDebouncedSave.ts
│
├── styles/
│   └── tokens.css                      # ★ CSS 변수 단일 원천 (기존 :root)
│
├── types/
│   ├── db.ts                           # supabase gen types (자동 생성, commit)
│   ├── survey.ts                       # 도메인 타입 (DB와 다르면 변환 함수 동반)
│   └── global.d.ts
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                     # 타임스탬프 기반 파일
│   │   ├── 20260421120000_init.sql     # 기존 schema.sql 이식
│   │   └── 20260501000000_workspaces.sql
│   ├── seed.sql                        # 로컬 개발용 시드
│   └── functions/
│       ├── notify-response/
│       │   └── index.ts                # Deno
│       ├── export-csv/
│       │   └── index.ts
│       └── _shared/
│           └── cors.ts
│
├── e2e/
│   ├── respondent.spec.ts
│   ├── builder.spec.ts
│   └── auth.spec.ts
│
├── public/
│   ├── fonts/                          # 셀프 호스팅 Pretendard (선택)
│   └── ...
│
├── docs/                               # ← 지금 이 폴더
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── MIGRATION.md
│   └── CONVENTIONS.md
│
├── scripts/
│   ├── gen-db-types.sh                 # supabase gen types 래퍼
│   └── (legacy) build.sh               # Phase 2 종료 시 삭제
│
├── .github/workflows/
│   ├── ci.yml                          # lint + typecheck + unit + e2e
│   ├── deploy.yml                      # (갱신) Next.js 빌드로 변경
│   └── lighthouse.yml                  # PR 성능 가드
│
├── legacy/
│   └── Formit.html                     # Strangler Fig 기간 동안 보존. Phase 2 완료 시 삭제
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

### 주요 의도

- **`app/(marketing)` vs `app/(app)` vs `app/r/[id]`**: 레이아웃·번들·캐시 정책이 서로 다른 세 영역을 라우트 그룹으로 명확히 분리
- **`components/ui`**: shadcn 생성물의 **behavior만** 남기고 styling은 Tailwind + 토큰으로 직접
- **`lib/supabase/{client,server,admin}`**: 호출 맥락별 클라이언트를 물리적으로 분리해 `service_role` 유출 방지
- **`legacy/Formit.html`**: Phase 2 완료 직전까지 존재. `vercel.json` rewrite의 fallback

---

## 5. 렌더링 전략 (라우트별)

| 경로                      | 렌더링               | 캐시            | 인증         | 비고                           |
| ------------------------- | -------------------- | --------------- | ------------ | ------------------------------ |
| `/`                       | SSG                  | `force-static`  | 비필요       | 빌드 시 생성                   |
| `/templates`              | SSG + ISR(1h)        | revalidate 3600 | 비필요       | 템플릿은 DB에 추가 가능 (향후) |
| `/pricing`                | SSG                  | static          | 비필요       |                                |
| `/dashboard`              | RSC + CSR            | no-store        | 필요         | 레이아웃에서 세션 검증         |
| `/s/[id]/edit`            | CSR 위주             | no-store        | 필요 (owner) | 빌더. Zustand + autosave       |
| `/s/[id]/share`           | RSC                  | no-store        | 필요 (owner) |                                |
| `/s/[id]/results`         | RSC + CSR            | no-store        | 필요 (owner) | 차트는 클라이언트              |
| **`/r/[id]`**             | **SSR + ISR(60s)**   | revalidate 60   | 비필요       | **설문 live 상태만 노출**      |
| `/r/[id]/opengraph-image` | **Edge Runtime**     | CDN cache       | 비필요       | `runtime = 'edge'`             |
| `/api/responses`          | Route Handler (Node) | no-store        | 비필요       | rate-limit + 봇 필터           |
| `/auth/callback`          | Route Handler        | no-store        | —            | Supabase code exchange         |

### `/r/[id]` 렌더링 상세

```tsx
// app/r/[id]/page.tsx
export const revalidate = 60;

export async function generateMetadata({ params }): Promise<Metadata> {
  const survey = await fetchLiveSurvey(params.id); // server-only supabase
  if (!survey) return { title: '설문을 찾을 수 없어요' };
  return {
    title: `${survey.emoji} ${survey.title} — Formit`,
    description: survey.description || '지금 이 설문에 참여해 주세요',
    openGraph: {
      images: [`/r/${params.id}/opengraph-image`],
      type: 'website',
    },
  };
}

export default async function Page({ params }) {
  const survey = await fetchLiveSurvey(params.id);
  if (!survey) notFound();
  return <RespondentForm survey={survey} />;
}
```

### OG 이미지 (Edge Runtime)

```tsx
// app/r/[id]/opengraph-image.tsx
export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG({ params }) {
  const survey = await fetchLiveSurveyPublic(params.id);
  return new ImageResponse(<OGCard survey={survey} />, { ...size });
}
```

---

## 6. 데이터 모델

### 6.1 현재 스키마 (그대로 유지 + 확장)

`supabase/schema.sql` 기반. Phase 0에서 `supabase/migrations/20260421120000_init.sql`로 이동.

```sql
-- 기존 그대로
surveys (
  id uuid PK,
  owner_id uuid FK auth.users,
  title text,
  description text,
  emoji text,
  color text,
  status text check (status in ('draft','live','closed')),
  sections jsonb,        -- ★ 설문 본문
  settings jsonb,
  created_at, updated_at
)

responses (
  id uuid PK,
  survey_id uuid FK surveys,
  answers jsonb,
  meta jsonb,
  submitted_at
)
```

### 6.2 Phase 별 스키마 확장

#### Phase 2 — 알림 설정

```sql
alter table surveys
  add column notify_email boolean not null default true,
  add column notify_threshold int not null default 1;  -- N개 단위 알림

create table notification_log (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  kind text check (kind in ('first_response','threshold','daily_digest')),
  sent_at timestamptz default now(),
  payload jsonb
);
```

#### Phase 3 — 워크스페이스 · 빌링 · 로직 점프

```sql
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','admin','editor','viewer')),
  primary key (workspace_id, user_id)
);

alter table surveys
  add column workspace_id uuid references workspaces(id);

create table subscriptions (
  workspace_id uuid primary key references workspaces(id),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('free','pro','team')),
  status text,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- 로직 점프는 기존 sections JSONB 안에서 question.logic 필드로 처리
-- (스키마 변경 없음, zod만 확장)
```

#### Phase 4 — AI 요약 캐시

```sql
create table ai_summaries (
  survey_id uuid references surveys(id) on delete cascade,
  question_id text not null,
  model text not null,
  summary jsonb not null,      -- { topics: [...], sentiment: {...} }
  generated_at timestamptz default now(),
  response_count_at_time int not null,
  primary key (survey_id, question_id, model)
);
```

### 6.3 `sections` JSONB 구조 (zod로 강제)

```ts
// lib/survey-schema.ts
export const QuestionTypeSchema = z.enum([
  'short_text',
  'long_text',
  'single_choice',
  'multi_choice',
  'scale',
  'nps',
  'rating',
  'date',
  'email',
  'section_intro',
]);

export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  scale: z
    .object({
      min: z.number(),
      max: z.number(),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional(),
    })
    .optional(),
  logic: z.array(LogicRuleSchema).optional(), // Phase 3
});

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(QuestionSchema),
});

export const SectionsSchema = z.array(SectionSchema);
```

### 6.4 타입 생성

```bash
# scripts/gen-db-types.sh
supabase gen types typescript --project-id $SUPABASE_PROJECT_REF \
  --schema public > types/db.ts
```

---

## 7. 인증 · 권한

### 7.1 인증 흐름

- **제작자**: Google OAuth (Supabase Auth). 서버/클라이언트에서 `@supabase/ssr`의 쿠키 기반 세션
- **응답자**: 익명. 인증 불필요. `meta`(UA/referrer/tz)만 기록

### 7.2 권한 = RLS

현 `schema.sql`의 RLS 정책은 그대로 정답. **애플리케이션에서 추가 권한 체크를 하지 않는다.**

- `surveys_owner_all`: owner는 자기 설문 all
- `surveys_public_read_live`: 누구나 `status='live'` 설문 SELECT
- `responses_public_insert_live`: 누구나 live 설문에 INSERT
- `responses_owner_select/delete`: owner만 자기 설문의 응답 접근

### 7.3 Next.js 통합

- **RSC/Route Handler**: `lib/supabase/server.ts`의 `createClient()` — cookies 기반 세션 자동 전달
- **클라이언트 컴포넌트**: `lib/supabase/client.ts` — 브라우저 메모리 세션
- **Edge Function**: `lib/supabase/admin.ts` — `service_role`. Edge Function 코드 내부에서만 import

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set({ name, value, ...options }),
      remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
    },
  });
}
```

### 7.4 `(app)` 레이아웃 가드

```tsx
// app/(app)/layout.tsx
export default async function AppLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');
  return <AppShell user={user}>{children}</AppShell>;
}
```

---

## 8. 디자인 시스템

### 8.1 토큰 보존 원칙

현재 `Formit.html`의 `:root` CSS 변수를 **그대로** `styles/tokens.css`에 이식합니다.
Tailwind 설정은 **이 CSS 변수를 참조**하는 형태로 구성해, 토큰 변경 시 코드 수정 없이 브랜드 테마가 바뀌도록 합니다.

```css
/* styles/tokens.css */
:root {
  --bg: #fbf7f2;
  --bg-elev: #ffffff;
  --bg-soft: #f4ede3;
  --ink: #1f1a14;
  --ink-2: #3a322a;
  /* ... 현재 Formit.html과 동일 ... */
  --accent: #e03e6c;
  --accent-ink: #b02656;
  --radius: 14px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 2px rgba(40, 25, 10, 0.04), 0 1px 1px rgba(40, 25, 10, 0.03);
}
```

### 8.2 Tailwind 매핑

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elev': 'var(--bg-elev)',
        'bg-soft': 'var(--bg-soft)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
          5: 'var(--ink-5)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
          soft: 'var(--accent-soft)',
          softer: 'var(--accent-softer)',
        },
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
        pop: 'var(--shadow-pop)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
};
```

### 8.3 shadcn 사용 규약

1. `npx shadcn@latest add <component>` 로 생성
2. 생성 파일에서 **className의 색/간격/쉐도우 관련 유틸을 전부 삭제**
3. Tailwind 토큰 기반 유틸로 **재작성**
4. **Radix primitive import와 prop 타입, variant 로직은 유지**
5. 스토리북/스니펫은 `CONVENTIONS.md §4` 참조

### 8.4 컴포넌트 계층

```
ui/*              ← shadcn 기반 프리미티브 (Button, Dialog, ...)
  └─ shared/*     ← 앱 특유 컴포넌트 (Sidebar, Toast, Avatar, ...)
       └─ builder/*, respondent/*, results/*  ← 도메인 전용
```

- `ui/*`는 도메인 모름
- `shared/*`는 앱 전역에서 재사용
- 도메인 폴더는 해당 페이지에서만

---

## 9. 상태 관리

### 9.1 서버 상태 — TanStack Query

| 쿼리 키                   | 훅                     | 무효화 시점                |
| ------------------------- | ---------------------- | -------------------------- |
| `['surveys', userId]`     | `useSurveys`           | 생성·삭제·복제 후          |
| `['survey', id]`          | `useSurvey(id)`        | 저장 후                    |
| `['responses', surveyId]` | `useResponses(id)`     | Realtime 구독 또는 polling |
| `['responseCount', id]`   | `useResponseCount(id)` | 60초마다 refetch           |

### 9.2 로컬 상태 — Zustand (빌더 전용)

빌더는 (a) 수백 번의 키 입력 (b) DnD (c) 디바운스 저장이 필요 → React 컨텍스트보다 zustand가 안전.

```ts
// components/builder/useBuilderStore.ts
interface BuilderState {
  survey: Survey;
  selectedBlockId: string | null;
  isDirty: boolean;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  moveQuestion: (id: string, toIndex: number, sectionId: string) => void;
  addBlock: (type: QuestionType, afterId?: string) => void;
  deleteBlock: (id: string) => void;
  reset: (survey: Survey) => void;
}
```

**Autosave**: `useDebouncedSave` 훅이 `isDirty`를 감지하고 1.5초 후 `mutate`.

### 9.3 URL 상태

- 탭: `?tab=edit|share|results` — 아니라 App Router로 `/s/[id]/(edit|share|results)` 세그먼트로 분리
- 필터/정렬 (대시보드): `nuqs` 사용

---

## 10. Supabase 사용 규약

1. **브라우저에서 직접 쿼리 허용**. RLS가 있으므로 안전. 불필요한 API proxy 금지
2. **응답 제출은 예외** — 서버 Route Handler 경유 (rate-limit 위해)
3. **Realtime 구독**: 빌더의 공동 편집은 Phase 4. 지금은 사용 안 함
4. **Storage**: 응답자 파일 업로드(Phase 3)는 서명 URL로 처리
5. **RPC**: `survey_response_count`처럼 민감 데이터 노출 없이 집계가 필요하면 Postgres function

### 서버·클라이언트 쿼리 예

```ts
// hooks/useSurveys.ts (클라이언트)
'use client';
import { createClient } from '@/lib/supabase/client';

export function useSurveys() {
  return useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const sb = createClient();
      const { data, error } = await sb
        .from('surveys')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data.map(fromDbSurvey);
    },
  });
}
```

```ts
// app/r/[id]/page.tsx (서버)
import { createClient } from '@/lib/supabase/server';

async function fetchLiveSurvey(id: string) {
  const sb = createClient();
  const { data } = await sb
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('status', 'live')
    .maybeSingle();
  return data ? fromDbSurvey(data) : null;
}
```

---

## 11. API · Edge Functions

### 11.1 Next.js Route Handlers

| 경로                      | 메서드 | 역할                                               |
| ------------------------- | ------ | -------------------------------------------------- |
| `/api/responses`          | POST   | 응답 제출. rate-limit + zod 검증 + Supabase insert |
| `/api/surveys/[id]/count` | GET    | 응답 수 (RPC 호출, CDN 캐시 60s)                   |
| `/api/exports/[id]`       | GET    | CSV 스트림 (Phase 3, 소유자 인증)                  |
| `/api/webhooks/stripe`    | POST   | Stripe 이벤트 (Phase 3)                            |

```ts
// app/api/responses/route.ts
import { ratelimit } from '@/lib/rate-limit';
import { ResponseSubmitSchema } from '@/lib/survey-schema';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const { success } = await ratelimit.limit(`submit:${ip}`);
  if (!success) return new Response('Too many requests', { status: 429 });

  const body = await req.json();
  const parsed = ResponseSubmitSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });

  const sb = createClient();
  const { data, error } = await sb
    .from('responses')
    .insert({
      survey_id: parsed.data.surveyId,
      answers: parsed.data.answers,
      meta: { ip_hash: hash(ip), ua: req.headers.get('user-agent'), tz: parsed.data.tz },
    })
    .select('id')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ id: data.id });
}
```

### 11.2 Supabase Edge Functions (Deno)

| 이름              | 트리거                          | 역할                       |
| ----------------- | ------------------------------- | -------------------------- |
| `notify-response` | DB webhook (`responses` insert) | Resend로 소유자에게 이메일 |
| `export-csv`      | HTTP (소유자 JWT 검증)          | 대용량 스트림 export       |
| `stripe-sync`     | Stripe 웹훅 프록시              | Phase 3. 구독 상태 DB 반영 |
| `ai-summarize`    | Scheduler (cron)                | Phase 4. 응답 AI 요약 갱신 |

```ts
// supabase/functions/notify-response/index.ts
import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

serve(async (req) => {
  const payload = await req.json(); // DB webhook payload
  const { survey_id } = payload.record;

  const admin = createClient(ENV.SUPABASE_URL, ENV.SERVICE_ROLE_KEY);
  const { data: survey } = await admin
    .from('surveys')
    .select('*, owner:auth.users(email)')
    .eq('id', survey_id)
    .single();
  if (!survey?.notify_email) return new Response('skipped');

  const resend = new Resend(ENV.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Formit <hello@formit.kr>',
    to: survey.owner.email,
    subject: `새 응답: ${survey.title}`,
    react: NewResponseEmail({ survey }),
  });
  return new Response('ok');
});
```

---

## 12. 보안 · 남용 방지

### 12.1 비밀 관리

| 키                              | 어디                    | 누가 읽나                |
| ------------------------------- | ----------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Vercel 환경변수         | 브라우저 OK              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel                  | 브라우저 OK              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Functions 환경 | **Edge Function만**      |
| `RESEND_API_KEY`                | Supabase Functions 환경 | Edge Function만          |
| `UPSTASH_REDIS_REST_URL/TOKEN`  | Vercel                  | Route Handler만          |
| `STRIPE_SECRET_KEY`             | Vercel                  | Route Handler만          |
| `POSTHOG_KEY`                   | Vercel                  | 브라우저 OK (write-only) |

**규칙**: Route Handler에서 `process.env.X`를 import하는 파일은 `'server-only'`를 반드시 import할 것.

```ts
// lib/supabase/admin.ts
import 'server-only'; // 빌드 시 브라우저 번들 유출 방지
```

### 12.2 응답 스팸 방지

- `/api/responses`에 Upstash rate-limit (IP별 분당 5, 일별 50)
- `meta.ip_hash` 저장 (해시만, HMAC SHA-256, 키 로테이션 가능)
- Phase 2: 선택적 hCaptcha (설정에서 토글)

### 12.3 권한 오남용 방지

- `service_role` 키는 Edge Function 외부에 **절대** 존재 금지. CI에서 grep 체크
- Next.js `admin.ts`는 `'server-only'`로 가드 (만일을 대비)

### 12.4 헤더 · CSP

`vercel.json` 헤더 유지 + 다음 추가:

```json
{ "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
{ "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://*.posthog.com; connect-src 'self' https://*.supabase.co https://*.posthog.com" }
```

(Phase 2에서 CSP를 설정. Next.js는 기본 inline 스크립트가 있어 `'unsafe-inline'` 필요할 수 있음 → nonce 사용 검토)

### 12.5 PII

- 응답 본문은 설문 작성자의 자산. 서버에서 로그에 남기지 않음
- Edge Function 로그에 `answers` 출력 금지 (정적 lint)
- `meta.ip_hash`만 저장, 원본 IP 저장 금지

---

## 13. 성능 예산

각 라우트의 **배포 시** 한계값. CI(Lighthouse)에서 회귀 감지.

| 라우트         | LCP        | TBT        | 초기 JS (gzip) |
| -------------- | ---------- | ---------- | -------------- |
| `/`            | ≤ 1.8s     | ≤ 100ms    | ≤ 90KB         |
| `/r/[id]`      | **≤ 1.5s** | **≤ 50ms** | **≤ 80KB**     |
| `/dashboard`   | ≤ 2.5s     | ≤ 200ms    | ≤ 180KB        |
| `/s/[id]/edit` | ≤ 3.0s     | ≤ 300ms    | ≤ 300KB        |

초과 시 PR 머지 블록. 예외는 PR 설명에 근거 기재.

---

## 14. 관측 · 분석

### 14.1 PostHog 이벤트 사전

| 이벤트                      | 속성                                    | 발생 위치             |
| --------------------------- | --------------------------------------- | --------------------- |
| `signed_in`                 | method                                  | auth/callback         |
| `survey_created`            | from_template                           | dashboard             |
| `survey_edited`             | block_count                             | builder (debounce 5s) |
| `survey_published`          | block_count, section_count              | share                 |
| `share_link_copied`         | channel=copy\|kakao\|slack              | share                 |
| `respondent_viewed`         | survey_id (set `distinct_id=anonymous`) | r/[id]                |
| `respondent_started`        |                                         | RespondentForm        |
| `respondent_submitted`      | seconds_spent, question_count           | POST 성공 후          |
| `respondent_abandoned`      | last_question_idx                       | beforeunload          |
| `notification_email_opened` |                                         | Resend webhook        |
| `upgrade_clicked`           | plan                                    | pricing               |
| `subscription_started`      | plan, workspace_id                      | stripe webhook        |

### 14.2 대시보드

- Viral funnel: `respondent_viewed → started → submitted`
- Creator funnel: `signed_in → survey_created → survey_published → respondent_submitted`

### 14.3 에러 (Phase 2)

- Sentry: 브라우저 + Edge Function + Route Handler
- `releaseTracking`: Vercel Git SHA

---

## 15. 환경 · 비밀 관리

### 15.1 환경 구분

| 환경       | 도메인                          | Supabase                             | Stripe    |
| ---------- | ------------------------------- | ------------------------------------ | --------- |
| Local      | http://localhost:3000           | 동일 프로젝트 (dev schema 분리 고려) | test mode |
| Preview    | `*.vercel.app` (PR)             | 동일 프로젝트                        | test mode |
| Production | `formit.vercel.app` 또는 커스텀 | 동일 프로젝트                        | live mode |

### 15.2 `.env.local.example`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Server only
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# (Phase 3)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Edge Function 비밀은 Supabase 대시보드 Functions → Secrets에서 관리.

---

## 16. CI/CD

### 16.1 `.github/workflows/ci.yml`

```yaml
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps
      - run: pnpm e2e
```

### 16.2 `deploy.yml` (기존 개정)

- `scripts/build.sh` 호출 삭제
- `vercel build` → `vercel deploy --prebuilt` 유지 (Next.js는 Vercel이 자동 감지)

### 16.3 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
on: pull_request
jobs:
  lhci:
    steps:
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            https://${{ env.PREVIEW_URL }}/
            https://${{ env.PREVIEW_URL }}/r/seed-demo
          budgetPath: .lighthouserc.json
```

`.lighthouserc.json`에서 `§13 성능 예산` 강제.

---

## 17. 테스트 전략

### 17.1 Unit (Vitest)

- `lib/*`의 순수 함수 100% (survey-schema, survey-utils, og)
- `hooks/*` (TanStack Query `QueryClientProvider` 래퍼)

### 17.2 Component (Vitest + RTL)

- `RespondentForm` (타입별 렌더링, 필수 검증)
- `QuestionBlock` (에디트 모드 스위치)
- `Sidebar` (라우팅 상태)

### 17.3 E2E (Playwright)

**최소 스모크 — 매 PR 실행**

- `auth.spec.ts`: Google 모킹 → 로그인 → 대시보드 표시
- `builder.spec.ts`: 새 설문 → 블록 추가 → 저장 → 재진입 유지
- `respondent.spec.ts`: `/r/[id]` 진입 → 모든 문항 렌더 → 제출 → 카운트 증가

Supabase 테스트 DB: 별도 프로젝트 또는 로컬 `supabase start`.

### 17.4 수동 스모크 체크리스트

`ROADMAP.md` 각 Phase의 Quality Gate에 포함.

---

## 18. 장애 · 롤백 · 백업

### 18.1 롤백

- **Vercel**: 배포 단위 즉시 rollback (Dashboard → Deployments → Promote)
- **DB 마이그레이션**: 각 migration은 대응 `down` 파일 쌍으로 작성 (Supabase CLI)
- **Feature Flag** (Phase 2 이후): PostHog Feature Flag로 신기능 단계 공개

### 18.2 DB 백업

- Supabase Pro 업그레이드 전까지는 매주 `pg_dump`를 GitHub Action으로 암호화 업로드 (선택)
- Phase 3 수익화 시점부터 Supabase Pro로 전환 (PITR 7일)

### 18.3 장애 커뮤니케이션

- 상태 페이지: 간단히 `/status` 정적 페이지 + `window.__FORMIT_STATUS`로 배너
- Phase 3 이후: Statuspage.io 또는 UptimeRobot 퍼블릭 페이지

---

## 19. 결정 기록 (ADR)

경미한 결정은 생략, 아래는 반드시 남기는 결정들. PR 본문에 `ADR:` 태그로 요약.

| #   | 결정                             | 배경                  | 대안                   | 날짜       |
| --- | -------------------------------- | --------------------- | ---------------------- | ---------- |
| 001 | Next.js App Router 채택          | SSR + OG, Vercel 최적 | Remix, Nuxt, SvelteKit | 2026-04-21 |
| 002 | TypeScript 전면 도입             | JSONB 스키마 안전성   | JSDoc                  | 2026-04-21 |
| 003 | shadcn behavior만 차용           | 브랜드 일관성         | 전면 도입 / 직접 제작  | 2026-04-21 |
| 004 | Strangler Fig 전환               | 무중단·롤백 용이      | Big Bang               | 2026-04-21 |
| 005 | pnpm · 단일 앱 · 비(非) 모노레포 | 초기 복잡도 최소화    | Turborepo              | 2026-04-21 |

향후 추가되는 결정은 `docs/adr/00N-title.md`에 별도 기록 (Phase 2 이후).

---

## 부록 A. 용어

- **설문(Survey)** — 제작자가 만드는 양식 한 건
- **섹션(Section)** — 설문 내 논리적 묶음
- **문항(Question/Block)** — 섹션 안의 단일 질문
- **응답(Response)** — 응답자가 제출한 전체 답안 한 건
- **답(Answer)** — 문항 하나에 대한 값
- **제작자(Creator/Owner)** — 로그인한 설문 소유자
- **응답자(Respondent)** — 공개 링크로 방문한 익명 사용자

## 부록 B. 의도적으로 하지 않는 것

- 자체 Auth
- GraphQL
- Redis 외 추가 캐시 계층
- 마이크로서비스
- 모바일 네이티브 앱 (PWA로 충분)
- 실시간 공동 편집 (Phase 4 이후 검토)
