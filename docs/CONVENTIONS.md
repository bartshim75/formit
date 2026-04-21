# Formit — Conventions

> 버전: v1.0
> 이 문서는 **모든 코드 PR**이 지켜야 할 컨벤션을 정의합니다.
> 의문이 생기면 먼저 [`ARCHITECTURE.md`](./ARCHITECTURE.md)를 읽고, 예외는 PR 설명에 기록하세요.

---

## 목차

1. [TypeScript 스타일](#1-typescript-스타일)
2. [파일 · 폴더 네이밍](#2-파일--폴더-네이밍)
3. [Lint · Format](#3-lint--format)
4. [shadcn 사용 규약](#4-shadcn-사용-규약)
5. [컴포넌트 패턴](#5-컴포넌트-패턴)
6. [Server Component vs Client Component](#6-server-component-vs-client-component)
7. [데이터 접근 패턴](#7-데이터-접근-패턴)
8. [에러 처리](#8-에러-처리)
9. [상태 관리 규칙](#9-상태-관리-규칙)
10. [스타일링 규칙](#10-스타일링-규칙)
11. [접근성](#11-접근성)
12. [테스트 규칙](#12-테스트-규칙)
13. [Git · 커밋 · PR](#13-git--커밋--pr)
14. [코드 리뷰 기준](#14-코드-리뷰-기준)
15. [문서 갱신](#15-문서-갱신)

---

## 1. TypeScript 스타일

### 1.1 tsconfig

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "target": "ES2022",
    "jsx": "preserve",
    "paths": { "@/*": ["./*"] },
  },
}
```

### 1.2 규칙

- **`any` 금지**. 불가피하면 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + 코멘트
- **`as` 캐스팅 최소화**. zod 파싱 또는 타입 가드 함수를 우선
- **DB 타입 ≠ 도메인 타입**.
  - `types/db.ts`는 자동 생성 (snake_case)
  - `types/survey.ts`는 애플리케이션 도메인 (camelCase)
  - 변환은 `fromDbSurvey` / `toDbSurvey` 함수로 일원화
- **`type` vs `interface`**
  - 원칙적으로 `type`. Union/Intersection이 일상
  - 예외: 라이브러리가 `interface`를 받는 경우 일치시키기
- **enum 금지**. `as const` 객체 또는 union string literal 사용
  ```ts
  export const SurveyStatus = { Draft: 'draft', Live: 'live', Closed: 'closed' } as const;
  export type SurveyStatus = (typeof SurveyStatus)[keyof typeof SurveyStatus];
  ```
- **함수 시그니처**
  - 공개 export는 반환 타입을 **명시**
  - 내부 헬퍼는 추론 허용
- **Null 안전**
  - `maybeSingle()`의 결과는 `T | null`. `.select().single()`과 혼용 금지
  - `?.` 체인보다 조건부 얼리 리턴 선호

### 1.3 zod 패턴

```ts
// lib/survey-schema.ts
export const QuestionSchema = z.object({ ... });
export type Question = z.infer<typeof QuestionSchema>;
```

- 런타임 경계(API input/output, DB → 도메인 변환, URL params)에서 **반드시** zod 통과
- 클라이언트/서버가 같은 스키마 재사용

---

## 2. 파일 · 폴더 네이밍

| 대상                | 규칙                                    | 예                                                                                                       |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 컴포넌트 파일       | PascalCase `.tsx`                       | `RespondentForm.tsx`                                                                                     |
| 훅 파일             | `useX.ts`                               | `useSurveys.ts`                                                                                          |
| 유틸/모듈           | kebab-case `.ts`                        | `survey-schema.ts`, `rate-limit.ts`                                                                      |
| Next.js 라우트 파일 | 소문자 규정대로                         | `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `not-found.tsx`, `error.tsx`, `opengraph-image.tsx` |
| 폴더                | kebab-case                              | `components/respondent/`, `lib/supabase/`                                                                |
| CSS                 | kebab-case                              | `tokens.css`, `globals.css`                                                                              |
| 테스트              | `.test.ts(x)` (unit) / `.spec.ts` (e2e) | `survey-utils.test.ts`, `respondent.spec.ts`                                                             |
| 타입                | 파일명 소문자                           | `types/db.ts`, `types/survey.ts`                                                                         |
| Edge Function       | 폴더+`index.ts`                         | `supabase/functions/notify-response/index.ts`                                                            |

### 익스포트 규칙

- **기본 export 최소화**. Next.js가 요구하는 곳(`page.tsx`, `layout.tsx` 등)과 이미지 컴포넌트에서만
- 나머지는 named export
- 파일 하나당 한 가지 책임. 500줄 넘으면 쪼개기 검토

---

## 3. Lint · Format

### 3.1 ESLint

```js
// eslint.config.mjs (flat config)
import next from 'eslint-config-next';
import ts from '@typescript-eslint/eslint-plugin';

export default [
  ...next('core-web-vitals'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/lib/supabase/admin', message: 'admin client는 Edge Function 전용입니다.' },
          ],
        },
      ],
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
```

### 3.2 Prettier

```jsonc
{
  "printWidth": 100,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"],
}
```

### 3.3 lefthook

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: '*.{ts,tsx}'
      run: pnpm exec eslint {staged_files}
    format:
      glob: '*.{ts,tsx,css,md}'
      run: pnpm exec prettier --write {staged_files} && git add {staged_files}
```

typecheck는 CI에서만(커밋 체감 속도 위해). 개발자는 에디터 TS 서버로 실시간 확인.

---

## 4. shadcn 사용 규약

> 목표: Radix primitive의 behavior(키보드 내비·포커스 트랩·a11y·variant 로직)는 **그대로 차용**, 스타일은 **Formit 토큰으로 재작성**.

### 4.1 프리미티브 추가 순서

1. `npx shadcn@latest add button`
2. 생성된 `components/ui/button.tsx` 열기
3. `cva()`의 variants에서 **색상/배경/쉐도우 관련 클래스 제거**
4. Formit 토큰 기반 클래스로 교체
5. 동일 변형 이름(`default`, `secondary`, `ghost`, `destructive` 등)은 가능한 유지하되, 브랜드 어울리는 이름으로 리네이밍 허용

### 4.2 예시 — Button

생성 직후 (shadcn 기본):

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md ...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        // ...
      },
    },
  },
);
```

**수정 후 (Formit 토큰)**:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center gap-2 whitespace-nowrap font-semibold',
    'rounded-full border transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-white border-accent shadow-pop hover:bg-accent-ink hover:border-accent-ink',
        secondary: 'bg-bg-elev text-ink border-border hover:bg-bg-soft hover:border-border-strong',
        ghost: 'bg-transparent text-ink border-transparent hover:bg-bg-soft',
        danger: 'bg-bad text-white border-bad hover:opacity-90',
      },
      size: {
        sm: 'px-3 py-1.5 text-[13px]',
        md: 'px-[18px] py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-[15px]',
        icon: 'w-10 h-10 justify-center p-0',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';
```

### 4.3 Dialog/Dropdown 등 compound primitive

- `@radix-ui/react-dialog`의 구조(Root·Trigger·Portal·Overlay·Content)는 그대로 유지
- `Content`의 배경/쉐도우만 토큰으로
- 애니메이션: `data-[state=open]:animate-in data-[state=closed]:animate-out` 유틸은 유지하되 duration/easing은 통일

### 4.4 Do / Don't

| Do                                      | Don't                                                           |
| --------------------------------------- | --------------------------------------------------------------- |
| Radix Root/Trigger 구조 유지            | shadcn 기본 색상(`bg-primary`, `text-foreground`) 유지          |
| `class-variance-authority` 패턴 유지    | 새 색상 토큰을 Tailwind config에 추가 없이 arbitrary color 사용 |
| 변형 이름에 의미(primary/danger)        | 임의 이름(`pink1`, `pink2`)                                     |
| 공용 컴포넌트에 비즈니스 로직 유입 금지 | `<Button>` 안에서 fetch 호출                                    |

---

## 5. 컴포넌트 패턴

### 5.1 구조

```tsx
'use client'; // 필요 시에만

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentPropsWithoutRef<'div'> & {
  tone?: 'default' | 'accent';
};

export const Card = forwardRef<HTMLDivElement, Props>(
  ({ tone = 'default', className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-bg-elev border-border rounded-lg border shadow-sm',
          tone === 'accent' && 'ring-accent ring-offset-bg ring-2 ring-offset-2',
          className,
        )}
        {...rest}
      />
    );
  },
);
Card.displayName = 'Card';
```

### 5.2 Props 규칙

- **합리적 기본값**. 명시적 `undefined` 처리 필요 없게
- 이벤트 핸들러는 `onThing` 네이밍 (`onSubmit`, `onAddBlock`)
- Boolean prop은 긍정형 (`disabled` 그대로, `hidden`, `readOnly`). `isDisabled` 처럼 `is` 접두사 권장
- 컨트롤드 vs 언컨트롤드를 섞지 말 것

### 5.3 컴포넌트 크기

- 200줄 초과 시 분할 검토
- 파일 내 서브 컴포넌트는 2개까지. 그 이상은 같은 폴더의 별도 파일로

---

## 6. Server Component vs Client Component

### 6.1 기본 원칙

- **기본은 Server Component** (App Router default)
- Client 전용은 상단에 `'use client';` 명시
- 클라이언트로 전환해야 하는 경우:
  - `useState`, `useEffect`, `useReducer`
  - 이벤트 핸들러, DOM 접근
  - Zustand, TanStack Query 훅
  - Third-party 클라이언트 라이브러리

### 6.2 경계 패턴

```tsx
// app/(app)/dashboard/page.tsx (server)
import { DashboardClient } from './DashboardClient';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const sb = createClient();
  const { data } = await sb.from('surveys').select('*').order('updated_at', { ascending: false });
  return <DashboardClient initialSurveys={data ?? []} />;
}
```

```tsx
// app/(app)/dashboard/DashboardClient.tsx (client)
'use client';
import { useSurveys } from '@/hooks/useSurveys';

export function DashboardClient({ initialSurveys }: { initialSurveys: Survey[] }) {
  const { data = initialSurveys } = useSurveys({ initialData: initialSurveys });
  return <>{/* ... */}</>;
}
```

### 6.3 금지

- Server Component에서 브라우저 API 사용 금지 (`window`, `localStorage`)
- Client Component에서 `service_role` 키 로드 금지 (빌드 가드 `'server-only'`)
- `app/api/*/route.ts`는 Node runtime 기본, Edge가 필요한 경우에만 명시 (`export const runtime = 'edge'`)

---

## 7. 데이터 접근 패턴

### 7.1 읽기

- **서버 구성요소에서 초기 데이터 로드**, 클라이언트는 TanStack Query로 구독 갱신
- 목록 쿼리: `['entity']` 또는 `['entity', filters]`
- 단일 쿼리: `['entity', id]`

### 7.2 쓰기

```ts
'use client';
const qc = useQueryClient();
const m = useMutation({
  mutationFn: async (input: UpdateSurveyInput) => {
    const sb = createClient();
    const { data, error } = await sb
      .from('surveys')
      .update(toDbSurvey(input))
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw error;
    return fromDbSurvey(data);
  },
  onSuccess: (updated) => {
    qc.setQueryData(['survey', updated.id], updated);
    qc.invalidateQueries({ queryKey: ['surveys'] });
  },
});
```

- **Optimistic update**는 빌더 autosave에서만 사용. 나머지는 await 후 토스트

### 7.3 응답 제출 — 예외

- 클라이언트 → `/api/responses` Route Handler 경유
- Route Handler가 zod 검증 + rate-limit 후 Supabase insert
- 일반 테이블 쿼리와 분리하는 이유: 브라우저에서 직접 insert 시 rate-limit을 걸 지점이 없음

---

## 8. 에러 처리

### 8.1 사용자 대면

- `Toast`로 요약 + `console.error`로 원본
- 비기술 메시지: "응답을 저장하지 못했어요. 잠시 후 다시 시도해 주세요"
- 재시도 가능한 작업은 토스트에 "다시 시도" 액션 버튼

### 8.2 서버

```ts
try {
  // ...
} catch (err) {
  captureServerError(err, { route: '/api/responses' });
  return Response.json({ error: 'internal' }, { status: 500 });
}
```

- 원인 메시지를 **그대로** 내려보내지 않음 (스택 노출 방지)
- Sentry(Phase 2+) 자동 캡처

### 8.3 Error Boundary

- `app/error.tsx`: 루트 대체 UI
- `app/(app)/error.tsx`: 앱 영역 전용
- 각 섹션에서 회복 가능한 경우 `reset()` 버튼

---

## 9. 상태 관리 규칙

- **서버 상태 = TanStack Query**, **로컬 상태 = Zustand (빌더) / useState (나머지)**
- Zustand 스토어는 **슬라이스 분리** (파일 하나당 하나)
- Context는 테마/사용자 같은 "읽기 위주 전역"에만. 잦은 업데이트에는 쓰지 말 것
- 파생 상태는 `useMemo`로 계산, Zustand에 저장하지 말 것

### 9.1 빌더 스토어 규칙

- **mutation 액션만 export**, state는 selector로 읽기
- Autosave는 스토어 바깥 훅(`useDebouncedSave`)에서 구독
- 역사는 Phase 3부터 `zundo` 검토 (undo/redo)

---

## 10. 스타일링 규칙

### 10.1 우선순위

1. **Tailwind 유틸 + 토큰** (`bg-bg-elev`, `text-ink-2`, `rounded-lg`)
2. Tailwind arbitrary values는 예외적으로만 (`w-[360px]` OK, `bg-[#FF0000]` **금지**)
3. 한 파일에서 재사용되는 조합은 `cva` 변형 또는 `@apply` (globals.css에서만)
4. 직접 CSS는 `tokens.css`와 `globals.css`에만

### 10.2 다크 모드

- MVP에서는 라이트 테마 단일. `prefers-color-scheme` 대응은 Phase 4에서 검토
- 클래스 기반 전환을 전제로 토큰을 설계 (필요 시 `:root.dark` 오버라이드)

### 10.3 애니메이션

- 기본 duration 150ms, easing `ease-out`
- 페이지 전환은 Next.js 기본
- 빌더 드래그 애니메이션은 `@dnd-kit`의 기본 + 커스텀 드롭 인디케이터

---

## 11. 접근성

### 11.1 기본

- 상호작용 요소는 `<button>`, `<a>` 등 시맨틱 태그. `div` 온클릭 **금지**
- 이미지 `alt` 필수 (장식은 `alt=""`)
- 폼 input은 `<label>` 연결 또는 `aria-label`
- 라이트 모드 포커스 링은 `--accent` 고정 (토큰)

### 11.2 키보드

- 전 화면을 키보드만으로 탐색 가능해야 함
- 빌더: 블록 이동/복제/삭제 단축키 문서화
- Radix primitive가 기본으로 처리하는 포커스 트랩에 의존

### 11.3 검사

- `axe-core`를 Playwright에 통합, 주요 페이지 0 violations 기준 (Phase 2.3.4)

---

## 12. 테스트 규칙

### 12.1 피라미드

- **많이**: 순수 함수 유닛 (`lib/*`)
- **중간**: 컴포넌트 (핵심 UX, 에러 경로)
- **적게**: E2E 스모크 (로그인→생성→공유→응답→결과)

### 12.2 E2E 시드

- `supabase/seed.sql`에 테스트 유저·설문 정의
- Playwright 전역 setup에서 `supabase db reset` (로컬 Supabase)

### 12.3 모킹

- 네트워크는 MSW (vitest component test)
- OAuth는 Supabase의 test email sign-in 또는 `/auth/callback` 우회 훅

---

## 13. Git · 커밋 · PR

### 13.1 브랜치

- `main` = 운영
- `feat/<짧은-설명>`, `fix/<...>`, `chore/<...>`
- 장수명 브랜치 금지 (1주 초과 시 머지/rebase)

### 13.2 커밋 메시지 (Conventional Commits)

```
type(scope): subject

body (optional)

footer (optional, e.g., "Closes #12", "ADR: 006")
```

- `type`: feat, fix, docs, style, refactor, perf, test, chore, build, ci
- `scope`: phase-N / builder / respondent / schema / infra ...
- subject: 한글 OK. 72자 이내

**예**:

- `feat(respondent): /r/[id] SSR 페이지와 동적 OG 이미지 추가`
- `fix(api): responses rate-limit이 x-forwarded-for 첫번째 IP만 사용하도록 수정`
- `chore(migration): legacy Formit.html 제거 (Phase 2.3.3)`

### 13.3 PR 체크리스트

```
- [ ] 해당 Phase의 Quality Gate 항목을 모두 만족한다
- [ ] TS strict에서 에러 0
- [ ] ESLint 경고 0
- [ ] 관련 Playwright E2E 갱신/추가
- [ ] PostHog 이벤트 추가/변경 시 docs/ARCHITECTURE.md §14.1 갱신
- [ ] DB 스키마 변경 시 migration + down 스크립트 쌍
- [ ] 보안 영향 있는 변경이면 "Security impact" 섹션 작성
- [ ] 스크린샷 / 짧은 녹화 (UI 변경 시)
```

### 13.4 PR 크기

- 500 LOC 이하 권장
- 불가피하면 "리뷰 시작점" 파일을 설명에 명시

---

## 14. 코드 리뷰 기준

### 14.1 기능

- 요구사항(Quality Gate)을 충족하는가
- 에러/경계 케이스 처리가 있는가
- UX가 응답자 · 제작자 둘 다의 입장에서 무리 없는가

### 14.2 설계

- 추상화가 필요 이상인가 (premature abstraction)
- 비슷한 코드가 3번째 등장하면 그때 추출
- 파일/폴더 위치가 컨벤션을 따르는가

### 14.3 성능

- 서버 컴포넌트에서 N+1 쿼리 없는가
- 클라이언트 번들 크기 변화 (> +10KB gzip 시 PR에 근거 필요)
- 빌더에서 불필요한 리렌더 없는가 (Zustand selector 활용)

### 14.4 보안

- `service_role` 키 경로 외 사용 없는가
- 유저 입력을 zod 없이 DB/외부 API로 보내지 않는가
- 에러 응답에 내부 메시지 노출 없는가

### 14.5 머지 기준

- 리뷰어 1명 LGTM (팀 2인 이상일 때 2명)
- CI 초록
- 스쿼시 머지 기본

---

## 15. 문서 갱신

- **ARCHITECTURE.md**: 스택/디렉토리/데이터 모델에 영향을 주는 변경 시 같은 PR에서 갱신
- **ROADMAP.md**: Phase 체크박스를 실시간으로 업데이트
- **MIGRATION.md**: rewrites 규칙이나 롤백 절차가 바뀌면 갱신
- **CONVENTIONS.md** (이 문서): 새로운 패턴을 3번째 도입할 때 규칙화
- **ADR**: `§ARCHITECTURE §19`에 추가 또는 `docs/adr/00N-title.md` (Phase 2 이후)

---

## 부록. 자주 쓰는 유틸

### `cn()` — 조건부 className

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 포맷터 (한국어)

```ts
// lib/format.ts
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatAgo = (d: Date | string) =>
  formatDistanceToNow(new Date(d), { addSuffix: true, locale: ko });

export const formatNumber = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
```
