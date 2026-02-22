# Vercel 배포/운영 가이드

이 문서는 Vercel + Vercel Postgres 기준으로 배포, 스케줄링, 실행 방법을 정리합니다.

## 1) Vercel 프로젝트 구성

모노레포에서 **프로젝트를 2개**로 분리하여 연결합니다.

- 프로젝트 A: `apps/web` (관리자 UI)
- 프로젝트 B: `apps/api` (API + 크론)

각 프로젝트의 **Root Directory**를 각각 `apps/web`, `apps/api`로 지정합니다.

## 2) Vercel Postgres 연결

- Vercel 대시보드에서 Postgres 생성
- `apps/api` 프로젝트에 연결
- 환경변수 `DATABASE_URL` 자동 주입 확인

## 3) 환경변수 설정

`apps/api` 프로젝트 기준으로 아래를 설정합니다.

필수
- `ADMIN_PASSWORD`: 키워드 관리 UI 접근 토큰
- `DATABASE_URL`: Vercel Postgres
- `CRON_SECRET`: 크론 호출용 Bearer 토큰
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 네이버 뉴스 API
- `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, `REPORT_EMAIL_TO`: 이메일 발송

선택
- `GOOGLE_NEWS_HL=ko`
- `GOOGLE_NEWS_GL=KR`
- `GOOGLE_NEWS_CEID=KR:ko`
- `REPORT_WINDOW_HOURS=24`
- `REPORT_MAX_ARTICLES=200`
- `REPORT_RISK_TERMS=리콜,불매,논란,소송,저작권,유출`
- `DEDUPE_TITLE_THRESHOLD=0.82`

`apps/web` 프로젝트에는 아래를 설정합니다.
- `NEXT_PUBLIC_API_BASE_URL`: `https://<api-project>.vercel.app`

## 4) DB 초기화 (Prisma)

로컬에서 1회 실행:

```bash
npm install
npm run prisma:generate -w packages/db
npm run prisma:push -w packages/db
```

Vercel에서도 `DATABASE_URL`이 세팅되어 있어야 합니다.

## 5) 스케줄러 설정

Vercel Scheduler에서 `apps/api`의 크론 엔드포인트를 매일 호출합니다.

- URL: `https://<api-project>.vercel.app/api/cron`
- Method: `GET`
- Header: `Authorization: Bearer <CRON_SECRET>`

## 6) 로컬 실행

```bash
npm install
npm run dev:web
npm run dev:api
```

- UI: `http://localhost:3000`
- API: `http://localhost:3001` (Next 기본 포트가 충돌 없을 때)

## 7) 동작 흐름 요약

1. 키워드 관리 UI에서 키워드 저장
2. 크론이 `/api/cron` 호출
3. 네이버 API + 구글 RSS 수집
4. 중복 제거 및 DB 저장
5. 최근 기사 이메일 리포트 발송

