# Formit — Engineering Docs

> 이 폴더는 Formit 제품을 이어서 개발하는 모든 사람을 위한 **단일 진입점**입니다.
> 새로 합류했다면 아래 순서대로 읽으세요.

---

## 읽는 순서

| 순번 | 문서                                   | 누구를 위한 문서인가                                        | 소요 시간 |
| ---- | -------------------------------------- | ----------------------------------------------------------- | --------- |
| 1    | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | 모든 기여자. 시스템의 "무엇"과 "왜".                        | 20분      |
| 2    | [`ROADMAP.md`](./ROADMAP.md)           | 실행자. Phase 0~4의 상세 To-Do · Quality Gate · Rollback.   | 40분      |
| 3    | [`MIGRATION.md`](./MIGRATION.md)       | Phase 1~2 담당자. 단일 HTML → Next.js 무중단 전환 플레이북. | 15분      |
| 4    | [`CONVENTIONS.md`](./CONVENTIONS.md)   | 코드 기여자. TS·네이밍·컴포넌트·커밋 규칙.                  | 10분      |

---

## 핵심 결정 사항 (요약)

- **프레임워크**: Next.js 15 App Router (Vercel)
- **언어**: TypeScript 전면 도입
- **디자인 시스템**: 기존 CSS 변수 토큰 **보존** + shadcn/ui는 **behavior(헤드리스 Radix 기반)만** 차용 · 스타일은 Tailwind + 토큰으로 직접
- **백엔드**: Supabase 유지 + Edge Functions 추가
- **마이그레이션**: Strangler Fig — `/r/[id]` 응답자 라우트부터 교체, 기존 `Formit.html`은 fallback 유지
- **전체 일정**: 10~12주 (Phase 0: 3일 / 1: 1주 / 2: 3주 / 3: 3주 / 4: 4주)

---

## 상위 원칙

1. **응답자 경험 > 제작자 경험**. 응답자 이탈은 즉시 지표가 죽는다.
2. **공유 링크 = 랜딩 페이지**. `/r/[id]`의 OG·LCP가 바이럴 계수를 지배한다.
3. **Strangler Fig만 한다**. Big Bang 재작성 금지. 언제든 롤백 가능해야 한다.
4. **지표 없는 기능은 배포하지 않는다**. 모든 기능은 PostHog 이벤트와 함께 출시.
5. **서버 비밀은 절대 브라우저로 나가지 않는다**. `service_role`은 Edge Function 전용.

---

## 진척도 추적

`ROADMAP.md`의 각 Phase 체크박스를 직접 갱신합니다. PR 머지 시 해당 Phase의 Quality Gate가 통과된 경우에만 체크하세요.

```
⛔ Quality Gate 미통과 상태에서 다음 Phase로 넘어가지 마세요.
```

---

## 추가 리소스 (루트 기준)

- `README.md` — 배포·환경변수·빠른 시작 (현행 유지)
- `supabase/SETUP.md` — Supabase·Google OAuth 초기 설정
- `supabase/schema.sql` — 현재 DB 스키마 (Phase 0에서 `migrations/`로 쪼갤 예정)
- `docs-wireframe/*.png` — 화면 와이어프레임 (`01~07`)
