# Formit — Supabase + Google OAuth 세팅 가이드

처음 한 번만 하면 됩니다. 소요 시간 약 15분.

완료 후 확보해야 할 값 3가지:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Supabase·Vercel·Google Cloud에 등록할 배포 URL (예: `https://formit.vercel.app`)

---

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속 → **Start your project** → GitHub로 로그인
2. 상단 **New project** 클릭
3. 입력
   - **Name**: `formit` (자유)
   - **Database Password**: 강력한 비밀번호 생성 후 안전한 곳(1Password 등)에 저장 — 잃어버리면 재설정해야 합니다
   - **Region**: `Northeast Asia (Seoul) - ap-northeast-2` 추천
   - **Plan**: Free
4. **Create new project** → 프로비저닝 2분 대기

---

## 2. 스키마 적용

1. 좌측 사이드바 **SQL Editor** 클릭 → **+ New query**
2. 이 레포의 [`supabase/schema.sql`](./schema.sql) 내용을 **전체 복사** 해서 에디터에 붙여넣기
3. 우측 하단 **Run** (단축키 `⌘/Ctrl + Enter`)
4. 출력창에 `Success. No rows returned` 뜨면 성공
5. 좌측 **Table Editor** 들어가서 `surveys`, `responses` 두 테이블이 생겼는지 확인

---

## 3. API 키 확보 (나중에 Vercel에 등록)

1. 좌측 사이드바 **Project Settings**(톱니바퀴) → **API**
2. 다음 두 값을 복사해서 보관:
   - **Project URL** → `SUPABASE_URL` (예: `https://abcdxyz.supabase.co`)
   - **Project API keys → `anon` `public`** → `SUPABASE_ANON_KEY`
   
   > ⚠️ 이 페이지에 있는 **`service_role`** 키는 절대 브라우저에 노출하지 마세요. Formit은 `anon` 키만 사용합니다 (RLS로 보호됨).

---

## 4. Google Cloud OAuth 클라이언트 만들기

### 4-1. 프로젝트 생성

1. https://console.cloud.google.com 접속
2. 상단 프로젝트 선택 드롭다운 → **새 프로젝트** → 이름 `Formit` → **만들기**
3. 만든 프로젝트를 선택 상태로 둡니다

### 4-2. OAuth 동의 화면 구성

1. 좌측 메뉴 → **API 및 서비스 → OAuth 동의 화면**
2. User Type: **외부** 선택 → **만들기**
3. 앱 정보 입력:
   - 앱 이름: `Formit`
   - 사용자 지원 이메일: 본인 이메일
   - 앱 로고: (선택) 생략 가능
   - **승인된 도메인** → `+ 도메인 추가`:
     - `supabase.co`
     - `vercel.app` (배포 도메인이 여기 아래 서브도메인이면)
     - 커스텀 도메인이 있다면 그것도 추가
   - 개발자 연락처: 본인 이메일
4. **저장 후 계속** → **범위**(기본값 그대로 저장) → **테스트 사용자**(본인 추가) → **저장 후 계속**
5. 상태가 **테스트 중**으로 남아있어도 본인 계정으로는 로그인 됩니다. 공개 전에 **게시** 하세요.

### 4-3. OAuth 2.0 클라이언트 ID 생성

1. 좌측 **API 및 서비스 → 사용자 인증 정보 → + 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
2. 애플리케이션 유형: **웹 애플리케이션**
3. 이름: `Formit Web`
4. **승인된 JavaScript 원본**:
   ```
   https://<your-vercel-domain>.vercel.app
   http://localhost:3000
   ```
   (Vercel 배포 후 받은 실제 도메인으로 교체. 로컬 테스트용 `localhost` 항목도 있으면 편합니다.)

5. **승인된 리디렉션 URI** — **이게 제일 중요합니다**:
   ```
   https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
   ```
   `<YOUR-SUPABASE-PROJECT-REF>`는 Supabase 프로젝트 URL의 서브도메인 부분입니다. 2번 단계에서 복사한 `SUPABASE_URL`과 동일합니다.

6. **만들기** → 팝업에 **클라이언트 ID**와 **클라이언트 보안 비밀번호**가 뜹니다. 둘 다 복사해두세요.

---

## 5. Supabase에 Google OAuth 등록

1. Supabase 프로젝트 → 좌측 **Authentication → Providers**
2. **Google** 행 확장 → **Enable** 토글 ON
3. 4-3에서 복사한 값 붙여넣기:
   - **Client ID (for OAuth)**: `xxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxx`
4. **Save**
5. 좌측 **Authentication → URL Configuration**:
   - **Site URL**: 배포 URL (예: `https://formit.vercel.app`)
   - **Redirect URLs** (줄바꿈으로 여러 개):
     ```
     https://formit.vercel.app
     https://formit.vercel.app/**
     http://localhost:3000
     http://localhost:3000/**
     ```
   - **Save**

---

## 6. 확보한 값 정리

다음 단계(Vercel 배포, [`../README.md`](../README.md))에서 사용합니다:

| 이름 | 어디서 얻었나 | 어디에 넣나 |
|---|---|---|
| `SUPABASE_URL` | 3번 단계 | Vercel 환경변수 |
| `SUPABASE_ANON_KEY` | 3번 단계 | Vercel 환경변수 |
| Vercel 배포 도메인 | Vercel 배포 후 | 4-3, 5번 단계(Google·Supabase URL 설정) |

> **팁**: Vercel을 먼저 한 번 배포해서 도메인을 받은 뒤, 그 도메인을 Google OAuth(4-3)와 Supabase URL Configuration(5)에 추가해도 됩니다. 이 경우 첫 배포 때는 로그인이 안 되는 게 정상이고, URL 등록 후부터 작동합니다.

---

## 트러블슈팅

**"redirect_uri_mismatch" 에러가 뜹니다.**
→ Google Cloud Console(4-3)의 "승인된 리디렉션 URI"가 정확히 `https://<project-ref>.supabase.co/auth/v1/callback` 인지 확인. 사용자 도메인이 아니라 **Supabase 도메인**이어야 합니다.

**로그인 후 화면이 하얘집니다.**
→ Supabase Authentication → URL Configuration의 **Redirect URLs**에 현재 접속한 도메인이 등록되어 있는지 확인.

**"You are signed in but cannot see any surveys."**
→ RLS가 정상 적용된 겁니다. 본인 계정으로 생성한 설문만 보입니다. 새로 만들어 보세요.

**응답이 제출되지 않습니다.**
→ 설문이 `live` 상태인지 확인. `draft` 또는 `closed` 상태에서는 응답 수신이 차단됩니다 (RLS 정책).
