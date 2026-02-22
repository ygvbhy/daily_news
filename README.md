# Daily News Crawler (Monorepo)

이 프로젝트는 **회사/브랜드 관련 뉴스를 매일 자동으로 수집하고 리포트**하는 시스템입니다.
비개발자도 이해할 수 있도록 구성/실행/기술 선택 이유를 자세히 설명합니다.

---

## 1) 무엇을 하는 프로젝트인가요?

- 네이버 뉴스, Google 뉴스에서 **키워드 기반 기사**를 수집합니다.
- 새로운 기사만 저장하고 **중복을 자동 제거**합니다.
- 매일 **이메일 리포트**를 자동으로 발송합니다.
- 키워드는 **관리자 웹 화면**에서 직접 추가/수정 가능합니다.

---

## 2) 전체 구성 (모노레포)

한 레포 안에 프론트/백엔드/공용 코드를 모두 관리합니다.

- `apps/web` : 관리자 웹 화면 (키워드 관리)
- `apps/api` : 수집/리포팅 API + 크론 실행 엔드포인트
- `packages/core` : 크롤러/중복제거/리포트 생성 로직
- `packages/db` : 데이터베이스(Prisma) 클라이언트

이 구조를 쓰면 **한 곳에서 함께 수정/배포**할 수 있어 관리가 쉽습니다.

---

## 3) 왜 이런 기술을 선택했나요?

### Next.js (apps/web, apps/api)
- 프론트/백엔드 모두 지원하는 프레임워크입니다.
- Vercel 배포와 궁합이 가장 좋습니다.
- 관리자 UI + API를 같은 방식으로 관리할 수 있습니다.

### Prisma + Vercel Postgres
- 데이터베이스 작업을 안전하고 간단하게 만들어줍니다.
- Vercel에서 바로 연동 가능하여 운영이 쉬워집니다.

### Resend (이메일 발송)
- SMTP 설정 없이 빠르게 이메일 발송 가능
- Vercel 환경에서 설정이 간단하고 안정적

### 네이버 뉴스 API + Google News RSS
- 네이버: 공식 API가 있어 안정적으로 기사 수집 가능
- 구글: 공식 API가 없어 RSS 방식으로 수집 (비공식)

---

## 4) 실행 흐름 (쉽게 이해하기)

1. 관리자 웹에서 키워드 저장
2. 매일 정해진 시간에 자동 실행
3. 네이버/구글 뉴스에서 기사 수집
4. 중복 기사 제거 후 DB 저장
5. 이메일로 요약 리포트 발송

---

## 5) 로컬 실행 방법

### 1) 환경변수 설정

루트에 `.env` 파일을 만들고 `.env.example`을 참고합니다.

### 2) 설치 및 실행

```bash
npm install
npm run prisma:generate -w packages/db
npm run prisma:push -w packages/db
npm run dev:web
npm run dev:api
```

- 관리자 UI: `http://localhost:3000`
- API: `http://localhost:3001` (포트 충돌 없을 때)

---

## 6) Vercel 배포 방법 (요약)

1. Vercel에 프로젝트 2개 연결
   - `apps/web`
   - `apps/api`
2. Vercel Postgres 생성 후 `apps/api`에 연결
3. 환경변수 설정
4. Scheduler로 `/api/cron` 매일 호출

자세한 내용은 `DEPLOYMENT.md`를 참고하세요.

---

## 7) 환경변수 정리

필수:
- `ADMIN_PASSWORD` : 관리자 UI 접근 토큰
- `DATABASE_URL` : Vercel Postgres 연결
- `CRON_SECRET` : 크론 호출용 토큰
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, `REPORT_EMAIL_TO`

선택:
- `GOOGLE_NEWS_HL=ko`
- `GOOGLE_NEWS_GL=KR`
- `GOOGLE_NEWS_CEID=KR:ko`
- `REPORT_WINDOW_HOURS=24`
- `REPORT_MAX_ARTICLES=200`
- `REPORT_RISK_TERMS=리콜,불매,논란,소송,저작권,유출`
- `DEDUPE_TITLE_THRESHOLD=0.82`

---

## 8) 핵심 파일 위치

### 관리자 UI
- `apps/web/src/app/page.tsx`

### API
- `apps/api/src/app/api/keywords/route.ts`
- `apps/api/src/app/api/cron/route.ts`

### 크롤러/리포트
- `packages/core/src/index.ts`
- `packages/core/src/report.ts`
- `packages/core/src/dedupe.ts`

### DB
- `packages/db/prisma/schema.prisma`

---

## 9) 참고 문서

- 배포/운영 가이드: `DEPLOYMENT.md`
- 전체 구현 요약: `PROJECT_OVERVIEW.md`

