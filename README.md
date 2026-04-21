# Formit

설문을 쉽고 따뜻하게. **Next.js 15(App Router) · TypeScript · Tailwind CSS 4** 기반의 한국어 설문 플랫폼입니다.

| 구분      | 기술                                                                                    |
| --------- | --------------------------------------------------------------------------------------- |
| 프론트    | React 19, TanStack Query, Zustand, `@dnd-kit`(빌더), `nuqs`(URL 상태), `recharts`(결과) |
| 백엔드    | Supabase(Postgres + RLS + Auth)                                                         |
| 배포      | Vercel, GitHub Actions(`ci`·`deploy`)                                                   |
| 분석·운영 | PostHog(클라·서버 캡처), Upstash Redis(응답 제출 레이트리밋, 선택)                      |

- **제작자**: Google OAuth로 로그인 후 대시보드·설문 편집·공유·결과 확인
- **응답자**: 로그인 없이 **`/r/<survey-id>`** 로 참여(설문 상태가 `live`일 때만)

상세 설계·로드맵은 [`docs/`](./docs/) 디렉터리([`docs/README.md`](./docs/README.md)부터)를 참고하세요.

---

## 요구 사항

- **Node.js** 20 이상 (`package.json`의 `engines` 참고)
- **pnpm** 9+ (Corepack 권장)

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 빠른 시작

### 1) Supabase

[`supabase/SETUP.md`](./supabase/SETUP.md)에 따라 프로젝트·Google OAuth·URL 설정을 마칩니다. DB에는 [`supabase/migrations/`](./supabase/migrations/) 순서대로 SQL을 적용하거나, 참고용 [`supabase/schema.sql`](./supabase/schema.sql)을 사용할 수 있습니다.

### 2) 환경 변수

저장소 루트에 **`.env.local`** 을 만들고 [`.env.local.example`](./.env.local.example)의 변수를 채웁니다.

| 변수                                                         | 용도                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 클라이언트(필수)                                      |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`       | 제품 분석(선택)                                                |
| `POSTHOG_KEY`                                                | 서버에서 PostHog로 이벤트 전송 시(선택, 없으면 public 키 사용) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`        | `/api/responses` 분·일 레이트리밋(미설정 시 리밋 비활성)       |
| `IP_HASH_SALT`                                               | 응답 `meta.ip_hash`용 HMAC salt(권장)                          |
| `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY`               | Phase 3(Edge·메일 등) 연동 시                                  |

### 3) 로컬 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

### 4) 품질 검사

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

E2E(Playwright)는 브라우저 바이너리가 필요합니다. 최초 한 번:

```bash
pnpm exec playwright install --with-deps   # CI와 유사
# 또는
pnpm exec playwright install chromium
pnpm e2e
```

---

## 주요 경로

| 경로              | 설명                           |
| ----------------- | ------------------------------ |
| `/`               | 랜딩 · Google 로그인 진입      |
| `/dashboard`      | 내 설문 목록(검색·복제·삭제)   |
| `/s/new`          | 새 설문 생성 후 편집으로 이동  |
| `/s/[id]/edit`    | 제목·설명·문항 빌더(DnD)       |
| `/s/[id]/share`   | 공개 전환, 링크·QR·임베드      |
| `/s/[id]/results` | 응답 목록·객관식 요약 차트     |
| `/r/[id]`         | 응답자용 공개 설문( `live` 만) |
| `/api/responses`  | 응답 제출 POST                 |
| `/api/health`     | 헬스 체크                      |

---

## 레포 구조

```
Formit/
├── app/                 # App Router, API Route, 레이아웃
├── components/          # 빌더, 응답자 UI, 프로바이더 등
├── docs/                # 아키텍처·로드맵·마이그레이션 가이드
├── e2e/                 # Playwright (+ axe 접근성 스모크)
├── hooks/               # React Query 훅
├── lib/                 # Supabase, 스키마, 분석, 레이트리밋
├── public/              # manifest 등 정적 파일
├── scripts/             # gen-db-types.sh 등
├── supabase/
│   ├── migrations/      # 버전별 SQL
│   ├── schema.sql       # 참고용 통합 스키마
│   └── SETUP.md
├── types/               # DB·도메인 타입
├── .github/workflows/ # ci.yml, deploy.yml
└── package.json
```

---

## Vercel 배포

1. [Vercel](https://vercel.com)에서 GitHub 레포를 Import합니다.
2. **Framework**: Next.js(자동 감지).
3. **Environment Variables**에 `.env.local.example`과 동일한 이름으로 Production·Preview에 값을 넣습니다.
4. Supabase **Authentication → URL Configuration**에 Vercel 도메인(및 로컬 URL)을 등록합니다. ([`supabase/SETUP.md`](./supabase/SETUP.md))

---

## GitHub Actions (`deploy`)

`main` 푸시 및 PR에 대해 Vercel 프리뷰/프로덕션 배포를 쓰려면 레포 **Secrets**에 다음을 등록합니다.

| Secret              | 설명                                                       |
| ------------------- | ---------------------------------------------------------- |
| `VERCEL_TOKEN`      | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID`     | `vercel link` 후 `.vercel/project.json`의 `orgId`          |
| `VERCEL_PROJECT_ID` | 같은 파일의 `projectId`                                    |

워크플로는 `vercel pull` → `vercel build` → `vercel deploy --prebuilt` 순서입니다. 앱 환경 변수는 Vercel 대시보드에서만 관리해도 됩니다.

PR에는 프리뷰 URL이 코멘트로 달립니다.

---

## 기타

- **Git hooks**: [`lefthook.yml`](./lefthook.yml) — 설치 후 `pnpm exec lefthook install` (선택).
- **DB 타입 재생성**: `pnpm db:types` (Supabase CLI·스크립트 전제, [`scripts/gen-db-types.sh`](./scripts/gen-db-types.sh)).
- **PWA**: [`public/manifest.json`](./public/manifest.json) — 아이콘 에셋은 필요 시 추가하세요.

---

## 체크리스트 (첫 배포 전)

- [ ] `supabase/migrations`를 Supabase에 적용했다.
- [ ] Google OAuth를 Supabase에 연결했다.
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_*` 등 필수 환경 변수를 넣었다.
- [ ] Google·Supabase에 배포 도메인(및 `http://localhost:3000/**`)을 등록했다.
- [ ] GitHub Secrets에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`를 넣었다(자동 배포 시).

배포 후: 랜딩 → 로그인 → 새 설문 → 편집 → 공유에서 **공개(live)** → 시크릿 창에서 `/r/...` 응답 → 결과 페이지에서 응답 반영을 확인합니다.
