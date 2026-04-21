# Formit

설문을 쉽고 따뜻하게. 단일 HTML 파일로 배포되는 한국어 설문 플랫폼.

- **로그인**: Google OAuth (제작자만)
- **백엔드**: Supabase (Postgres + RLS) — 무료 티어로 시작
- **호스팅**: Vercel — GitHub Actions로 자동 배포
- **응답자**: 로그인 불필요, `#/r/<id>` 링크로 바로 응답

---

## 빠른 시작 (처음 한 번)

### ① Supabase 세팅 — 약 15분

[`supabase/SETUP.md`](./supabase/SETUP.md) 참고. 완료하면 다음을 손에 넣습니다:

- `SUPABASE_URL` (예: `https://abcd.supabase.co`)
- `SUPABASE_ANON_KEY` (공개 키, 브라우저에 노출되어도 안전)
- Google OAuth 클라이언트 ID/Secret (Supabase에 등록까지 끝난 상태)

### ② GitHub 레포 생성 후 이 디렉토리 푸시

```bash
cd /Users/shawn/Public/Antigravity/Formit
git init
git add .
git commit -m "Initial Formit"
git branch -M main
git remote add origin https://github.com/<YOU>/formit.git
git push -u origin main
```

### ③ Vercel 프로젝트 생성 & 연결

1. https://vercel.com 로그인 → **Add New → Project**
2. GitHub에서 **formit** 레포 Import
3. **Framework Preset**: `Other` (자동 감지됨)
4. **Environment Variables** 에 두 개 추가 (Production · Preview 둘 다 체크):
   - `SUPABASE_URL` = (①의 URL)
   - `SUPABASE_ANON_KEY` = (①의 anon key)
5. **Deploy** — 첫 배포가 되면서 도메인(예: `formit-abc.vercel.app`)이 발급됩니다
6. 받은 도메인을:
   - Google Cloud → OAuth 클라이언트 → **승인된 JavaScript 원본**에 추가
   - Supabase → Authentication → URL Configuration → **Site URL + Redirect URLs**에 추가
   
   (자세한 단계는 [`supabase/SETUP.md`](./supabase/SETUP.md) 4–5번 섹션)

### ④ GitHub Actions 연결 (CI/CD 자동화)

이 레포에는 이미 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)이 들어있습니다. 아래 3개 시크릿만 등록하면 `main` 푸시마다 자동 배포됩니다.

**로컬에서 Vercel 프로젝트 정보 가져오기** (한 번만):
```bash
npm i -g vercel
vercel login
vercel link      # 프로젝트 선택 → .vercel/project.json 생성
cat .vercel/project.json
# {"projectId":"prj_xxx","orgId":"team_xxx"}
```

**Vercel 토큰 발급**: https://vercel.com/account/tokens → **Create Token** → 이름 `GitHub Actions` → 생성 후 값 복사.

**GitHub 레포 → Settings → Secrets and variables → Actions → New repository secret** 로 아래 3개 등록:

| Secret 이름 | 값 |
|---|---|
| `VERCEL_TOKEN` | 방금 만든 토큰 |
| `VERCEL_ORG_ID` | `.vercel/project.json`의 `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json`의 `projectId` |

> `SUPABASE_URL` / `SUPABASE_ANON_KEY`는 GitHub에 넣을 필요 **없습니다**. CI가 `vercel pull`로 Vercel에서 끌어옵니다. 한 곳에서만 관리하세요.

이후 `git push origin main` → GitHub Actions가 자동으로:
1. `vercel pull`로 환경변수 가져오기
2. `scripts/build.sh`로 `dist/index.html` 생성 (토큰 치환)
3. `vercel deploy --prebuilt --prod`로 프로덕션 배포

PR을 열면 자동으로 preview 배포 URL이 PR 코멘트로 달립니다.

---

## 구조

```
Formit/
├── Formit.html              # 메인 SPA (React + JSX, Babel standalone 컴파일)
├── scripts/
│   └── build.sh             # __SUPABASE_URL__, __SUPABASE_ANON_KEY__ 토큰을 env로 치환 → dist/index.html
├── supabase/
│   ├── schema.sql           # DB 스키마 + RLS 정책 + 응답 수 RPC
│   └── SETUP.md             # Supabase · Google OAuth 세팅 가이드
├── vercel.json              # Vercel 빌드·헤더 설정
├── .github/workflows/
│   └── deploy.yml           # main 푸시 자동 배포, PR preview
└── design-bundle/           # 원본 디자인 (깃 제외)
```

### 데이터 모델 (Supabase)

- `surveys` — 설문 한 건 (title, emoji, sections JSONB, status, owner_id)
- `responses` — 응답 한 건 (survey_id, answers JSONB, meta)
- RLS로 제작자만 자기 설문·응답 접근, 누구나 `status='live'` 설문 읽기·응답 제출

### 인증 흐름

- **제작자**: Google OAuth → `auth.users`에 저장 → surveys.owner_id로 연결
- **응답자**: 익명. `#/r/<uuid>` URL만 있으면 접근. `meta`에 UA/referrer/timezone만 기록

### 링크 구조

- `https://formit.vercel.app/` — 랜딩 / 로그인
- `https://formit.vercel.app/#/r/<survey-id>` — 응답자용 공개 링크

---

## 로컬 개발

### Supabase 없이 데모 모드로 빠르게 보기
토큰을 치환하지 않고 그대로 열면 자동으로 "데모 모드" 배너가 뜨고 `SEED_SURVEYS` 샘플 데이터로 동작합니다. 실제 저장은 안 됩니다.

```bash
open Formit.html     # 바로 브라우저에서 열기
```

### Supabase 연결해서 로컬에서 돌리기
```bash
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
./scripts/build.sh                       # dist/index.html 생성
python3 -m http.server 3000 -d dist      # http://localhost:3000
```

Google OAuth 리디렉션이 `http://localhost:3000`으로 돌아오게 하려면 Supabase Authentication → URL Configuration의 Redirect URLs에 `http://localhost:3000/**`도 추가해 두세요 (이미 [`supabase/SETUP.md`](./supabase/SETUP.md)에 안내됨).

---

## 체크리스트

첫 배포 전 확인:

- [ ] `supabase/schema.sql`을 Supabase SQL Editor에서 실행했다
- [ ] Google Cloud OAuth 클라이언트를 만들고 Supabase에 Client ID/Secret을 등록했다
- [ ] Vercel 환경변수에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 넣었다
- [ ] Vercel이 발급한 도메인을 Google OAuth "승인된 JavaScript 원본"에 추가했다
- [ ] Supabase Authentication → URL Configuration에 배포 도메인을 등록했다
- [ ] GitHub Secrets에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`를 넣었다

배포 후 스모크 테스트:

- [ ] 배포 URL 접속 → Landing 보임
- [ ] "Google로 시작하기" → 내 Google 계정으로 로그인 성공
- [ ] 대시보드에 내 설문 목록이 뜸 (처음엔 비어있음)
- [ ] 새 설문 만들기 → 문항 추가 → "공개" 클릭 → 링크 획득
- [ ] 시크릿 창에서 공개 링크 열기 → 응답자 UI 정상 표시 → 제출
- [ ] 원래 창으로 돌아와 Results 탭 → 응답 수가 늘어난 것 확인
