# Formit — Roadmap (Phase 0 ~ 4)

> 버전: v1.0 · 기간: 10~12주
> 각 Phase는 **독립 배포 가능 + 롤백 가능**이어야 합니다.
> 이 문서는 실행자를 위한 체크리스트입니다. 개념적 배경은 [`ARCHITECTURE.md`](./ARCHITECTURE.md), 무중단 전환 상세는 [`MIGRATION.md`](./MIGRATION.md) 참조.

---

## PROGRESS PROTOCOL

각 Phase 종료 시:

1. ✅ 모든 체크박스 완료
2. 🔍 Quality Gate 전 항목 통과
3. 📝 Notes & Learnings 섹션에 회고
4. ➡️ 다음 Phase 시작

```
⛔ Quality Gate 미통과 상태에서 다음 Phase로 진행 금지.
⛔ Phase 1~2 종료 전까지 기존 Formit.html은 legacy/로만 존재하고 동작해야 합니다.
```

---

## 전체 일정

| Phase | 이름                | 기간 | 주요 산출물                                                                |
| ----- | ------------------- | ---- | -------------------------------------------------------------------------- |
| **0** | 기반 다지기         | 3일  | Next.js + TS + Tailwind 프로젝트 · Supabase SSR · tokens.css · legacy 이전 |
| **1** | 응답자 라우트 이식  | 1주  | `/r/[id]` SSR · 동적 OG · rate-limit · PostHog 이벤트                      |
| **2** | 제작자 앱 전체 이식 | 3주  | 랜딩·대시보드·빌더·공유·결과 전부 Next.js로. Formit.html 제거              |
| **3** | 그로스 & 수익화     | 3주  | 이메일 알림 · 워크스페이스 · Pro 플랜 · 로직 점프 · CSV export             |
| **4** | 인텔리전스          | 4주  | AI 요약 · A/B · Webhook/Slack · PWA · i18n                                 |

> 총 11주(기준). 병렬 작업 시 단축 가능. 주 40h 1인 기준.

---

## Risk Register (전 Phase 공통)

| 리스크                                 | 확률 | 영향     | 완화                                                                                |
| -------------------------------------- | ---- | -------- | ----------------------------------------------------------------------------------- |
| 응답자 URL 동작 중단                   | 낮음 | **치명** | Vercel rewrites로 기존 Formit.html fallback 유지. Phase 1에서 staging URL 병행 운영 |
| RLS 정책 변경 실수                     | 중   | 높음     | 모든 migration은 로컬 `supabase db reset`으로 검증 후 머지                          |
| Babel → 번들러 전환 시 UI 회귀         | 중   | 중       | Playwright 스냅샷 + 페이지별 스모크 체크리스트                                      |
| `service_role` 키 유출                 | 낮음 | **치명** | `server-only` import + CI grep. Edge Function 외 사용 금지                          |
| OG 이미지 Edge cold start              | 중   | 낮음     | ISR 60s + CDN 캐시. 실패 시 정적 폴백                                               |
| Stripe 결제 테스트 미비 (Phase 3)      | 중   | 높음     | 별도 Stripe 테스트 모드 환경, 웹훅 서명 검증 필수                                   |
| TS strict mode에서 대량 에러 (Phase 2) | 높음 | 중       | Phase 0에서 `strict: true`로 스캐폴드 시작, 파일 이식 시 타입 동시 정리             |

---

# Phase 0 — 기반 다지기

> **Goal**: 이후 모든 Phase가 올라탈 토대 세팅. 이 Phase는 사용자가 볼 변화 없음.
> **Duration**: 3일 (24h 내)
> **Dependencies**: 없음

## 0.1 Tasks — 프로젝트 스캐폴드 (Day 1, 4h)

- [ ] **저장소 재구성**
  - [ ] 현재 루트 파일 보존: `Formit.html` → `legacy/Formit.html`로 이동
  - [ ] `scripts/build.sh`는 그대로 유지 (`legacy/Formit.html` 경로로 수정)
  - [ ] `dist/` 생성 경로 유지 (fallback용)
- [ ] **Next.js 15 프로젝트 생성**
  ```bash
  pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false \
    --import-alias="@/*" --turbopack
  ```

  - [ ] `package.json` 엔진 필드: `"node": ">=20"`
  - [ ] `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`
- [ ] **pnpm 세팅**
  - [ ] `pnpm-workspace.yaml`은 **생성하지 않음** (단일 앱)
  - [ ] `.npmrc`: `auto-install-peers=true`
- [ ] **Prettier · ESLint · lefthook**
  - [ ] `.prettierrc` 공유 (CONVENTIONS §3)
  - [ ] ESLint: `next/core-web-vitals` + `@typescript-eslint/strict`
  - [ ] `lefthook.yml`: pre-commit에 lint-staged (typecheck는 CI에서만)

## 0.2 Tasks — 디자인 토큰 이전 (Day 1, 2h)

- [ ] `app/globals.css` 생성, Tailwind directives + `@import './tokens.css'`
- [ ] `styles/tokens.css` 생성 — 현 `Formit.html`의 `:root`를 **그대로** 복사
- [ ] `tailwind.config.ts`에 토큰 매핑 (ARCHITECTURE §8.2 참조)
- [ ] `next/font`로 Pretendard + JetBrains Mono 로드 (옵션: Google Fonts CDN 유지해도 OK)

## 0.3 Tasks — Supabase 통합 (Day 1~2, 4h)

- [ ] 패키지 설치: `@supabase/supabase-js @supabase/ssr`
- [ ] `lib/supabase/client.ts` — 브라우저 `createBrowserClient`
- [ ] `lib/supabase/server.ts` — `createServerClient(cookies)`
- [ ] `lib/supabase/admin.ts` — `service_role` + `'server-only'` 가드
- [ ] `app/auth/callback/route.ts` — OAuth code exchange
- [ ] `.env.local.example` 작성, `.env.local`은 `.gitignore`에 이미 포함돼 있음
- [ ] **`schema.sql` 이전**
  - [ ] `supabase/migrations/20260421120000_init.sql` = 현재 `schema.sql` 내용
  - [ ] `supabase/config.toml` 생성 (`supabase init`)
  - [ ] 로컬 `supabase start`로 스키마 적용 확인
  - [ ] `pnpm db:types` 스크립트 (ARCHITECTURE §6.4)

## 0.4 Tasks — 타입·스키마 (Day 2, 3h)

- [ ] `types/db.ts` 자동 생성 커밋
- [ ] `lib/survey-schema.ts` — zod `Section`, `Question`, `Answer`, `ResponseSubmit`
- [ ] `lib/survey-utils.ts` — 기존 `data.jsx`의 pure fn 이식 (타입 포함)
- [ ] `types/survey.ts` — 도메인 타입 + DB 변환 함수 `fromDbSurvey`, `toDbSurvey`

## 0.5 Tasks — 분석·품질 (Day 2, 2h)

- [ ] PostHog 설치 + `lib/analytics.ts` 래퍼 (opt-out 지원)
- [ ] `.github/workflows/ci.yml` 신설 (typecheck/lint/test/e2e placeholder)
- [ ] Vitest + Playwright 설치, 각 최소 1개 테스트 (통과만 하면 됨)

## 0.6 Tasks — 배포 파이프라인 (Day 3, 3h)

- [ ] `vercel.json` 재작성
  - [ ] `buildCommand` 제거 (Next.js 자동 감지)
  - [ ] `rewrites` 추가: Phase 1 이전까지 신규 앱이 404면 legacy로 fallback
    ```json
    {
      "rewrites": [
        {
          "source": "/:path*",
          "destination": "/legacy/:path*",
          "has": [{ "type": "header", "key": "x-formit-legacy", "value": "1" }]
        }
      ]
    }
    ```
  - [ ] 실제 legacy fallback은 [`MIGRATION.md`](./MIGRATION.md) 참조
- [ ] `.github/workflows/deploy.yml` 갱신
  - [ ] `scripts/build.sh` 호출 제거
  - [ ] Vercel이 Next.js를 자동 빌드
  - [ ] PR 프리뷰 URL 코멘트는 기존 그대로
- [ ] 최초 배포: `/api/health`가 200 반환 (간단한 Route Handler 추가)

## 0.7 Quality Gate

- [ ] `pnpm dev`로 로컬 기동, `http://localhost:3000` 접속 시 "Formit — 준비 중" 페이지 보임
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` 모두 pass
- [ ] Vercel preview 배포 성공 (200 응답)
- [ ] 기존 `legacy/Formit.html`을 `x-formit-legacy: 1` 헤더로 접근 시 정상 동작
- [ ] Supabase 로컬에서 `schema.sql` 적용 + `surveys`, `responses` 테이블 확인
- [ ] GitHub Actions 전 워크플로우 초록

## 0.8 Rollback

- Vercel에서 이전 배포(기존 `Formit.html` 단일 배포)로 Promote
- `legacy/` 폴더는 그대로 두고 `vercel.json`만 복구

## 0.9 Notes & Learnings

- _이 섹션은 Phase 완료 시 채우세요._

---

# Phase 1 — 응답자 라우트 이식 (★ ROI 최상)

> **Goal**: 응답자 `/r/[id]`를 Next.js SSR로 재구현. 동적 OG 이미지로 **공유 링크 CTR 즉시 상승**.
> **Duration**: 1주 (40h)
> **Dependencies**: Phase 0 완료

## 1.1 Tasks — 응답자 페이지 SSR (Day 1~2, 10h)

- [ ] `app/r/[id]/page.tsx` 생성
  - [ ] `generateMetadata`로 설문 제목/설명 주입
  - [ ] `revalidate = 60`
  - [ ] 404는 `not-found.tsx`
  - [ ] RLS 기반 server 쿼리 (`.eq('status','live')`)
- [ ] `components/respondent/RespondentForm.tsx` 이식
  - [ ] 기존 `Formit.html`의 `Respondent` + `ResponderQuestion` 컴포넌트 → TS 분할
  - [ ] 필수 검증, 에러 메시지 위치, 접근성 유지
  - [ ] zod로 클라이언트 사이드 검증 (`lib/survey-schema.ts` 재사용)
- [ ] `components/respondent/QuestionRenderer.tsx` — 타입별 스위치
- [ ] `app/r/[id]/loading.tsx` · `not-found.tsx`

## 1.2 Tasks — 응답 제출 API (Day 2~3, 6h)

- [ ] Upstash Redis 계정 · 무료 DB 생성
- [ ] `lib/rate-limit.ts` — `@upstash/ratelimit` 래퍼 (IP별 분당 5, 일별 50)
- [ ] `app/api/responses/route.ts`
  - [ ] Body zod 검증
  - [ ] Rate limit 적용
  - [ ] `meta.ip_hash` (HMAC SHA-256, env에 salt)
  - [ ] `meta.ua`, `meta.tz`, `meta.referrer`
  - [ ] 성공 시 `{ id }` 반환 + PostHog 이벤트
- [ ] `/api/surveys/[id]/count/route.ts` — RPC `survey_response_count` 프록시 (60s CDN)

## 1.3 Tasks — 동적 OG 이미지 (Day 3~4, 8h) ★

- [ ] `app/r/[id]/opengraph-image.tsx`
  - [ ] `runtime = 'edge'`
  - [ ] 1200x630
  - [ ] 설문 제목 · 이모지 · 제작자 표시명 · "지금 답해주세요" CTA
  - [ ] 브랜드 그라데이션 배경 (accent → accent-ink)
  - [ ] 폰트: Pretendard 중복 로드 (Edge의 경우 fetch + Buffer)
- [ ] `app/r/[id]/twitter-image.tsx` 동일 컴포넌트 재사용
- [ ] 캐시 전략: `Cache-Control: public, s-maxage=60, stale-while-revalidate=86400` (response 헤더 확인)
- [ ] 수동 테스트:
  - [ ] https://www.opengraph.xyz/url/... 로 프리뷰 확인
  - [ ] 카톡 PC에서 링크 붙여넣고 썸네일 렌더 확인
  - [ ] 슬랙에서 unfurl 확인

## 1.4 Tasks — Strangler 라우팅 (Day 4~5, 4h)

- [ ] `vercel.json` rewrites 갱신
  - [ ] `/r/:id*` → 새 Next.js (default)
  - [ ] 그 외 경로 → `legacy/Formit.html` rewrite (MIGRATION §2 참조)
- [ ] 기존 링크 호환성
  - [ ] 기존 해시 링크 `/#/r/<id>`를 방문 시 JS로 `/r/<id>`로 redirect
  - [ ] `legacy/Formit.html`의 respondent 라우터에 "이 링크는 새 주소로 이동했어요" 스니펫 삽입
- [ ] 운영 URL에서 QR 재생성 없음 (기존 share 페이지의 QR은 절대경로이므로 자동 반영)

## 1.5 Tasks — 관측 (Day 5, 3h)

- [ ] PostHog 이벤트: `respondent_viewed`, `respondent_started`, `respondent_submitted`, `respondent_abandoned` (beforeunload)
- [ ] 이벤트 funnel 대시보드 생성 (PostHog)
- [ ] `lib/analytics.ts`에 서버 측 `captureServerEvent` 헬퍼 (응답 제출 시 서버 captures)

## 1.6 Tasks — 테스트 (Day 5~6, 6h)

- [ ] `e2e/respondent.spec.ts`
  - [ ] 시드 설문 1개를 `live`로 세팅 (test fixture)
  - [ ] `/r/<id>` 접근 → 모든 문항 렌더
  - [ ] 필수 미입력 제출 시 에러 표시
  - [ ] 정상 입력 → 제출 → 완료 화면 → 카운트 증가
- [ ] `e2e/og.spec.ts`
  - [ ] `/r/<id>/opengraph-image` fetch → `Content-Type: image/png`, 200 응답
- [ ] `vitest`: `RespondentForm` 타입별 렌더 스냅샷

## 1.7 Tasks — 성능 검증 (Day 6, 3h)

- [ ] Lighthouse CI 설정 (`lhci/cli`)
- [ ] 예산 초과 시 CI 빨강
- [ ] `/r/[id]` LCP ≤ 1.5s, 초기 JS ≤ 80KB

## 1.8 Quality Gate

- [ ] `/r/[id]` 응답자 플로우 전체가 신규 Next.js에서 동작
- [ ] **카톡/슬랙/X(Twitter)**에서 공유 시 설문별 OG 카드가 실제로 렌더
- [ ] `legacy/Formit.html`의 제작자 영역(대시보드/빌더/결과)는 **변함없이** 동작
- [ ] E2E 초록, Lighthouse 예산 통과
- [ ] Rate limit 초과 시 429 반환 확인 (curl 스크립트)
- [ ] PostHog에서 `respondent_viewed` ↔ `respondent_submitted` 퍼널 측정 시작됨

## 1.9 Rollback

- `vercel.json` rewrites에서 `/r/:id*` 규칙 제거하면 기존 `legacy/Formit.html`이 다시 처리
- DB 변경 없음 → 데이터 롤백 불필요

## 1.10 Notes & Learnings

- _Phase 완료 시 기입._

---

# Phase 2 — 제작자 앱 전체 이식

> **Goal**: 랜딩·대시보드·빌더·공유·결과 전부 Next.js로 옮기고, `legacy/Formit.html`을 제거한다.
> **Duration**: 3주 (120h)
> **Dependencies**: Phase 1 완료

## 2.1 Week 1 — 퍼블릭 페이지 (랜딩/템플릿) + 대시보드

### 2.1.1 랜딩 (Day 1~2, 10h)

- [ ] `app/(marketing)/layout.tsx` — 공용 헤더/푸터
- [ ] `app/(marketing)/page.tsx` — 기존 `Landing.jsx` 이식
  - [ ] 히어로·기능 섹션·사용 사례 전부 컴포넌트 분리 (`components/marketing/*`)
  - [ ] CTA 로그인은 Supabase OAuth 시작 함수로
- [ ] SSG 확인 (`next build` 후 `.next/server/app/page.html`)

### 2.1.2 템플릿 (Day 2~3, 6h)

- [ ] `app/(marketing)/templates/page.tsx` — 기존 `Templates.jsx` 이식
- [ ] 템플릿 메타는 우선 `lib/templates.ts`에 하드코딩 (향후 DB 이관)
- [ ] 선택 시 `/(app)/s/new?template=<id>` 라우트로 이동 (아래)

### 2.1.3 대시보드 (Day 3~5, 14h)

- [ ] `app/(app)/layout.tsx` — Sidebar + 세션 검증 (RSC에서 `auth.getUser`)
- [ ] `app/(app)/dashboard/page.tsx` — 기존 `Dashboard.jsx` 이식
- [ ] `hooks/useSurveys.ts` — TanStack Query
- [ ] 삭제·복제 mutation
- [ ] 상태 필터 (`draft/live/closed`) URL 상태화 (`nuqs`)
- [ ] `app/(app)/s/new/route.ts` — 새 설문 생성 후 `/(app)/s/[id]/edit`로 redirect

### 2.1.4 Quality Gate (Week 1 End)

- [ ] 로그인 → 대시보드 → 새 설문 → 빌더 스텁 진입까지 플로우 성공
- [ ] 랜딩·템플릿 페이지 LCP ≤ 1.8s
- [ ] 기존 Formit.html은 계속 동작 (빌더·공유·결과는 아직 legacy에서 처리)
- [ ] `vercel.json`에서 랜딩/대시보드 라우트가 신규로 넘어갔는지 확인

## 2.2 Week 2 — 빌더 (Builder)

### 2.2.1 Zustand 스토어 (Day 1, 4h)

- [ ] `components/builder/useBuilderStore.ts` — 전체 설문 상태 + 액션
- [ ] `hooks/useDebouncedSave.ts` — isDirty 감지, 1.5s debounce로 Supabase upsert
- [ ] 네트워크 실패 재시도, 충돌 감지 (`updated_at` 비교) — 실패 시 "서버 버전이 더 최신" 토스트

### 2.2.2 블록 에디터 (Day 2~4, 16h)

- [ ] `components/builder/BlockList.tsx` — `@dnd-kit/sortable`
- [ ] `components/builder/QuestionBlock.tsx` — 기존 이식, inline 편집
- [ ] `components/builder/AddBlockMenu.tsx`
- [ ] `components/builder/Inspector.tsx` — 우측 패널
- [ ] 문항 타입별 편집 UI (기존 `QUESTION_TYPES` 재사용)
- [ ] 키보드 단축키: ⌘↑/⌘↓ 이동, ⌘D 복제, Delete 삭제 (접근성 고려)

### 2.2.3 Page 통합 (Day 5, 6h)

- [ ] `app/(app)/s/[id]/edit/page.tsx`
  - [ ] 서버에서 초기 설문 로드 → 클라이언트 스토어 주입
  - [ ] 소유권 검증 (RLS가 일단 보장, UX로 404 처리)
- [ ] `app/(app)/s/[id]/layout.tsx` — 탭 네비 (Edit · Share · Results)

### 2.2.4 Quality Gate (Week 2 End)

- [ ] 빌더에서 새 설문 → 블록 10개 추가 → 페이지 새로고침 → 유지
- [ ] 오프라인 → 재온라인 시 pending 변경 재전송
- [ ] 빌더 초기 JS ≤ 300KB (dnd-kit 포함)
- [ ] Playwright `builder.spec.ts` 통과

## 2.3 Week 3 — 공유 / 결과 + legacy 제거

### 2.3.1 공유 페이지 (Day 1~2, 8h)

- [ ] `app/(app)/s/[id]/share/page.tsx` — 기존 `Share.jsx` 이식
- [ ] 링크 · QR · 임베드 코드
- [ ] 공개/비공개 토글 (status draft ↔ live)
- [ ] 카톡/슬랙 공유 버튼 (Web Share API + 폴백)
- [ ] `share_link_copied` 이벤트 (channel 속성)

### 2.3.2 결과 페이지 (Day 2~4, 14h)

- [ ] `app/(app)/s/[id]/results/page.tsx` — 기존 `Results.jsx` 이식
- [ ] `components/results/*` 차트 (recharts 또는 직접)
- [ ] NPS 게이지 · 응답 타임라인 · 문항별 카드
- [ ] 응답 개별 뷰 (Phase 3에 CSV export 예정)

### 2.3.3 legacy 제거 (Day 5, 4h) ★

- [ ] 모든 트래픽이 신규 Next.js로 가는지 확인 (Vercel access log + PostHog)
- [ ] `vercel.json`의 legacy rewrite 완전 제거
- [ ] `legacy/Formit.html` 삭제
- [ ] `scripts/build.sh` 삭제 (혹은 `scripts/legacy-build.sh`로 예비 보존)
- [ ] `dist/` 디렉토리 제거 (`.gitignore`에서 제거 가능)
- [ ] README 갱신 (배포/개발 지침)

### 2.3.4 접근성 스윕 (Day 5, 3h)

- [ ] 주요 페이지에 `axe` 자동 검사 (0 violations)
- [ ] 키보드 전용 내비게이션 수동 테스트
- [ ] 포커스 링 가시성 확인 (토큰 `--accent`)

## 2.4 Phase 2 Quality Gate

- [ ] `legacy/Formit.html`이 레포에 없음
- [ ] E2E: 로그인 → 새 설문 → 블록 추가 → 공개 → 응답자 링크 → 응답 → 결과 확인 까지 통과
- [ ] 모든 라우트 Lighthouse 예산 통과
- [ ] Sentry 연결, 배포 릴리즈 추적 (옵션)
- [ ] PostHog 퍼널에 `signed_in → survey_created → survey_published → respondent_submitted` 지표 live

## 2.5 Rollback

- Phase 2 중간 롤백: Vercel에서 해당 배포 이전으로 Promote (legacy 복구는 Phase 2.3.3 이전 커밋으로 revert)
- 2.3.3 이후: `legacy/Formit.html`이 이미 삭제되었으므로 커밋 revert로만 복구 가능 → **2.3.3 수행 전에 반드시 1주일 병행 관찰 후 실시**

---

# Phase 3 — 그로스 & 수익화

> **Goal**: 리텐션·바이럴·수익을 만드는 기능. 실제 이메일 알림·팀·Pro 플랜까지.
> **Duration**: 3주 (120h)
> **Dependencies**: Phase 2 완료

## 3.1 Week 1 — 알림 + 응답자 경험 개선

### 3.1.1 이메일 알림 (Day 1~3, 14h)

- [ ] Resend 계정 생성 + 도메인 인증 (SPF/DKIM/DMARC)
- [ ] DB: `alter table surveys add notify_email, notify_threshold` + `notification_log`
- [ ] Supabase Edge Function `notify-response`
  - [ ] DB Webhook: `responses` insert
  - [ ] threshold 로직 (1개·10개·50개·일일 요약)
  - [ ] React Email 템플릿 (`components/emails/NewResponseEmail.tsx`)
- [ ] 설정 UI: `/(app)/s/[id]/share` 하단에 알림 토글/임계값 입력
- [ ] 테스트: Mailosaur 또는 실제 이메일 주소로 수동 검증

### 3.1.2 응답자 경험 (Day 3~5, 10h)

- [ ] localStorage draft (설문별 키, 제출 시 클리어)
- [ ] 진행률 바 (섹션별 `n / N`)
- [ ] 섹션 스크롤 애니메이션 (기존 동일)
- [ ] "몇 명이 이미 답했어요" 소셜 프루프 (`/api/surveys/[id]/count`)
- [ ] 모바일 포커스 UX (auto-advance, IME 호환)

## 3.2 Week 2 — 워크스페이스 + 빌링

### 3.2.1 워크스페이스 스키마 (Day 1, 3h)

- [ ] Migration: `workspaces`, `workspace_members`, `surveys.workspace_id`
- [ ] 기존 설문을 각 유저의 기본 워크스페이스로 이전 (migration 안에서)
- [ ] RLS 업데이트: owner_id → workspace_id 기반 + role 체크

### 3.2.2 UI (Day 2~3, 10h)

- [ ] `/(app)/settings/workspace` — 멤버 초대 (email-based), 역할 변경
- [ ] Sidebar 상단 워크스페이스 전환기
- [ ] 초대 이메일 (Resend)

### 3.2.3 Stripe 통합 (Day 3~5, 14h)

- [ ] `subscriptions` 테이블
- [ ] `/api/webhooks/stripe` Route Handler
  - [ ] 서명 검증
  - [ ] `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`
- [ ] `/(marketing)/pricing/page.tsx`
- [ ] `/(app)/settings/billing` — Stripe Customer Portal 링크
- [ ] Pro 제한 로직 (free: 월 100응답, pro: 무제한)
- [ ] 한도 도달 시 "업그레이드하세요" 배너 (응답자에게는 노출 X)

## 3.3 Week 3 — 로직 점프 + Export

### 3.3.1 로직 점프 (Day 1~3, 14h)

- [ ] zod 스키마 확장: `Question.logic: LogicRule[]`
  - `{ when: { questionId, op: 'equals'|'gt'|'contains', value }, then: 'jump'|'end', target?: string }`
- [ ] 빌더 인스펙터에 로직 UI
- [ ] 응답자 렌더러에서 로직 평가 → 다음 문항/종료
- [ ] 무한 루프 감지 (빌더에서 경고)

### 3.3.2 Export (Day 3~4, 8h)

- [ ] Edge Function `export-csv`
  - [ ] 소유자 JWT 검증
  - [ ] 스트림 응답 (Transfer-Encoding: chunked)
  - [ ] Excel 친화 CSV (BOM + ko_KR 날짜)
- [ ] 결과 페이지에 "다운로드" 버튼

### 3.3.3 웹훅 알림 (Day 4~5, 6h)

- [ ] `surveys.webhook_url` 컬럼
- [ ] `notify-response` Edge Function 확장: 웹훅 POST (HMAC 서명)
- [ ] 설정 UI + "테스트 전송" 버튼
- [ ] Slack incoming webhook 가이드 링크

## 3.4 Phase 3 Quality Gate

- [ ] 응답 왔을 때 소유자 이메일이 실제로 도착
- [ ] Stripe 테스트 모드에서 결제 → 웹훅 수신 → DB 업데이트 확인
- [ ] 워크스페이스 팀원 초대 → 설문 공유 → 권한별 동작 확인
- [ ] 로직 점프: 문항1=A → 문항3로 점프, 문항1=B → 문항2로 진행 E2E
- [ ] CSV export 대량 응답(10k)에서도 메모리 이슈 없음
- [ ] Pro 한도 초과 설문 생성 시도 시 차단
- [ ] 새 Sentry 에러 0건 (Phase 2 대비)

## 3.5 Rollback

- Stripe 웹훅 실패 시: DB 수동 동기화 스크립트 (`scripts/sync-stripe.ts`)
- 워크스페이스 마이그레이션 실수 시: 모든 설문의 workspace_id를 NULL로 되돌리고 RLS 임시 완화 (비상용)

---

# Phase 4 — 인텔리전스

> **Goal**: AI·A/B·i18n·PWA로 제품을 한 단계 위로.
> **Duration**: 4주 (160h)
> **Dependencies**: Phase 3 완료

## 4.1 Week 1 — AI 요약

- [ ] `ai_summaries` 테이블
- [ ] Edge Function `ai-summarize`
  - [ ] 긴 텍스트 응답(`long_text`) 50건 이상일 때 자동 트리거
  - [ ] OpenAI/Anthropic API 중 택1 (비용 검토)
  - [ ] 토픽 클러스터링 + 감성 분석 → JSONB
  - [ ] 비용 가드: 같은 response_count_at_time에서는 재계산 스킵
- [ ] 결과 페이지 AI 요약 카드
- [ ] "다시 요약" 수동 트리거 (Pro only)

## 4.2 Week 2 — A/B 테스트 & Feature Flags

- [ ] PostHog Feature Flags 연동 (`lib/flags.ts`)
- [ ] 설문 버전 기능
  - [ ] `survey.variants: jsonb` (같은 설문의 분기 2~3개)
  - [ ] 응답자 접근 시 `flagValue`로 variant 선택
  - [ ] 결과 페이지에 variant별 지표 분리
- [ ] 랜딩 A/B (hero 카피/CTA)

## 4.3 Week 3 — i18n + PWA

- [ ] `next-intl` 설치
- [ ] 응답자 UI 자동 감지 (브라우저 locale → ko/en)
- [ ] 설문 자체의 다국어 필드는 Phase 5 검토 (현재는 UI chrome만)
- [ ] PWA manifest + Service Worker
  - [ ] 응답자 오프라인 시 draft 저장 (이미 구현된 localStorage 확장)
  - [ ] 제작자 대시보드 오프라인 읽기 전용

## 4.4 Week 4 — Webhook 생태계 + 운영 안정화

- [ ] Zapier 앱 등록 (공개 설문 이벤트)
- [ ] 공개 API (설문 생성/응답 조회) — 별도 인증 토큰
- [ ] 운영 지표 대시보드 (Supabase Studio 또는 Metabase 연결)
- [ ] 온보딩 체크리스트 (대시보드 상단 → 첫 설문 · 첫 응답 · 공유)
- [ ] Statuspage 공개

## 4.5 Phase 4 Quality Gate

- [ ] AI 요약이 실제 설문 50건 응답에서 의미 있는 토픽 출력
- [ ] A/B variant가 실제 트래픽 분할 후 결과 통계로 확인 가능
- [ ] i18n: 브라우저 `en-US`로 접속 시 UI 영문 렌더
- [ ] PWA: 비행기 모드에서 응답 draft 재개
- [ ] Zapier 트리거 정상 동작
- [ ] 공개 API Rate limit + 인증 시나리오 E2E

## 4.6 Rollback

- AI 요약: Feature Flag로 off → UI 숨김
- A/B: variant가 문제되면 `survey.variants = null` 업데이트
- PWA: SW 자체를 unregister하는 kill-switch 경로 배포

---

## 전체 Notes & Learnings (누적)

| Phase | 완료일  | 배운 점 | 회고 |
| ----- | ------- | ------- | ---- |
| 0     | _(TBD)_ |         |      |
| 1     |         |         |      |
| 2     |         |         |      |
| 3     |         |         |      |
| 4     |         |         |      |

---

## 부록: Phase별 의존 라이브러리 추가

| Phase | 라이브러리                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | next, react, typescript, tailwindcss, @supabase/{supabase-js,ssr}, zod, eslint, prettier, vitest, playwright, lefthook                                                    |
| 1     | @upstash/ratelimit, @upstash/redis, posthog-js, recharts (준비)                                                                                                           |
| 2     | @tanstack/react-query, zustand, @dnd-kit/{core,sortable,utilities}, lucide-react, react-hook-form, @hookform/resolvers, nuqs, date-fns, radix-ui/react-\* (shadcn 생성분) |
| 3     | resend, @react-email/components, stripe, @stripe/stripe-js                                                                                                                |
| 4     | next-intl, openai 또는 @anthropic-ai/sdk, workbox-next (PWA)                                                                                                              |

## 부록: 금지 사항 (공통)

- `service_role` 키를 `lib/supabase/admin.ts` 외부에서 import 금지 (CI 스크립트로 검출)
- `any` 타입 신규 추가 금지 (불가피하면 `// @ts-expect-error` + 이유)
- 인라인 스타일 사용 금지 (동적 색은 CSS 변수 오버라이드)
- `Formit.html`을 Phase 2.3.3 이후 복원 금지 (history에서 확인)
